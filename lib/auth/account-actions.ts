'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { deleteOtherSessions, requireUser } from '@/lib/auth/session';
import { consumeToken, issueToken } from '@/lib/auth/tokens';
import type { FormState } from '@/lib/auth/types';
import { appUrl, sendEmail } from '@/lib/email/send';
import { resetPasswordTemplate, verifyEmailTemplate } from '@/lib/email/templates';
import { prisma } from '@/lib/prisma';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  profileSchema,
  resetPasswordSchema,
} from '@/lib/validation/auth';

const COOLDOWN_MESSAGE = 'We just sent you an email. Please wait a minute before asking for another.';

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

async function sendVerificationEmail(userId: string, name: string, to: string, newEmail?: string) {
  const token = await issueToken(userId, 'EMAIL_VERIFY', { newEmail });
  if (!token) return 'cooldown' as const;

  const url = `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  await sendEmail({ to, ...verifyEmailTemplate(name, url), devLink: url });
  return 'sent' as const;
}

export async function updateProfile(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser('/account/profile');
  const values = { name: text(formData, 'name'), email: text(formData, 'email') };

  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return { values, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { name, email } = parsed.data;

  if (email === user.email) {
    await prisma.user.update({ where: { id: user.id }, data: { name } });
    revalidatePath('/account', 'layout');
    return { values: { name, email }, success: 'Profile updated.' };
  }

  // Changing the sign-in email is sensitive, so ask for the password again.
  const currentPassword = text(formData, 'currentPassword');
  if (!currentPassword) {
    return { values, fieldErrors: { currentPassword: ['Enter your current password to change your email'] } };
  }
  const record = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!record || !(await verifyPassword(currentPassword, record.passwordHash))) {
    return { values, fieldErrors: { currentPassword: ['Incorrect password'] } };
  }

  const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (taken) {
    return { values, fieldErrors: { email: ['An account with this email already exists'] } };
  }

  try {
    const outcome = await sendVerificationEmail(user.id, name, email, email);
    if (outcome === 'cooldown') return { values, error: COOLDOWN_MESSAGE };
  } catch (error) {
    console.error('sending verification email failed', error);
    return { values, error: 'We couldn’t send the confirmation email. Please try again.' };
  }

  await prisma.user.update({ where: { id: user.id }, data: { name } });
  revalidatePath('/account', 'layout');
  return {
    values: { name, email: user.email },
    success: `We sent a confirmation link to ${email}. Your email changes once you open it.`,
  };
}

export async function changePassword(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser('/account/profile');

  const parsed = changePasswordSchema.safeParse({
    currentPassword: text(formData, 'currentPassword'),
    newPassword: text(formData, 'newPassword'),
    confirmPassword: text(formData, 'confirmPassword'),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { currentPassword, newPassword } = parsed.data;

  const record = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!record || !(await verifyPassword(currentPassword, record.passwordHash))) {
    return { fieldErrors: { currentPassword: ['Incorrect password'] } };
  }

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
  await deleteOtherSessions(user.id);
  return { success: 'Password updated. You’ve been signed out of your other devices.' };
}

export async function resendVerification(): Promise<FormState> {
  const user = await requireUser('/account/profile');
  if (user.emailVerifiedAt) return { success: 'Your email is already verified.' };

  try {
    const outcome = await sendVerificationEmail(user.id, user.name, user.email);
    if (outcome === 'cooldown') return { error: COOLDOWN_MESSAGE };
  } catch (error) {
    console.error('sending verification email failed', error);
    return { error: 'We couldn’t send the email. Please try again.' };
  }
  return { success: `Confirmation link sent to ${user.email}.` };
}

// Public: the emailed token is the credential, so no session is required. The
// token is only spent by this POST, never by loading the page (link scanners
// would otherwise burn it).
export async function confirmEmail(_prevState: FormState, formData: FormData): Promise<FormState> {
  const record = await consumeToken(text(formData, 'token'), 'EMAIL_VERIFY');
  if (!record) return { error: 'This link is invalid or has expired. Request a new one from your profile.' };

  try {
    await prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date(), ...(record.newEmail ? { email: record.newEmail } : {}) },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: 'That email address is now used by another account.' };
    }
    throw error;
  }

  // No revalidatePath here: it would re-render /verify-email, whose pre-check
  // sees the token just spent and replaces the success message with "invalid".
  // The account pages are dynamic, so they read the new value on next visit.
  return { success: 'Your email is confirmed.' };
}

const FORGOT_MESSAGE = 'If an account exists for that email, we’ve sent a link to reset your password.';

// Public. Same answer whether or not the account exists, so it can't be used to
// find out which emails are registered.
export async function requestPasswordReset(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: text(formData, 'email') });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true },
  });

  if (user) {
    try {
      const token = await issueToken(user.id, 'PASSWORD_RESET');
      if (token) {
        const url = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
        await sendEmail({ to: user.email, ...resetPasswordTemplate(user.name, url), devLink: url });
      }
    } catch (error) {
      // Logged, not shown: surfacing it would reveal that the account exists.
      console.error('sending reset email failed', error);
    }
  }

  return { success: FORGOT_MESSAGE };
}

export async function resetPassword(_prevState: FormState, formData: FormData): Promise<FormState> {
  // Validated before the token is spent, so a typo doesn't burn the link.
  const parsed = resetPasswordSchema.safeParse({
    token: text(formData, 'token'),
    newPassword: text(formData, 'newPassword'),
    confirmPassword: text(formData, 'confirmPassword'),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const record = await consumeToken(parsed.data.token, 'PASSWORD_RESET');
  if (!record) return { error: 'This reset link is invalid or has expired. Request a new one.' };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    // Using the emailed link proves they own the inbox.
    prisma.user.updateMany({
      where: { id: record.userId, emailVerifiedAt: null },
      data: { emailVerifiedAt: new Date() },
    }),
    // Whoever knew the old password is signed out everywhere.
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);

  redirect('/login?reset=1');
}

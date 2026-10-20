import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

const COOKIE_NAME = 'beu_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  emailVerifiedAt: Date | null;
}

// Only the hash is stored, so a leaked database can't be replayed as cookies.
function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(COOKIE_NAME);
}

// After a password change: sign out everywhere except the browser making the change.
export async function deleteOtherSessions(userId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  await prisma.session.deleteMany({
    where: { userId, ...(token ? { tokenHash: { not: hashToken(token) } } : {}) },
  });
}

// Memoized per render pass so a page and its action/children share one lookup.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, expiresAt: true, user: { select: { id: true, name: true, email: true, role: true, emailVerifiedAt: true } } },
  });
  if (!session) return null;

  if (session.expiresAt <= new Date()) {
    await prisma.session.deleteMany({ where: { id: session.id } });
    return null;
  }

  return session.user;
});

// `next` is where to send the user after they sign in.
export async function requireUser(next?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(next ? `/login?next=${encodeURIComponent(next)}` : '/login');
  }
  return user;
}

// Admin pages and every admin Server Action must call this: actions are public
// POST endpoints, so the layout check alone doesn't protect them. Signed-out
// visitors go to sign-in; signed-in customers get a 404 so /admin isn't advertised.
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser('/admin');
  if (user.role !== 'ADMIN') {
    notFound();
  }
  return user;
}

// Only same-origin paths: "//evil.com" and "/\evil.com" would be treated as
// protocol-relative URLs by the browser.
export function safeNextPath(value: unknown, fallback = '/account'): string {
  if (typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  return value;
}

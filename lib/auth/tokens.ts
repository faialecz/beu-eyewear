import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import type { AuthTokenType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const TTL_MS: Record<AuthTokenType, number> = {
  EMAIL_VERIFY: 24 * 60 * 60 * 1000,
  PASSWORD_RESET: 60 * 60 * 1000,
};

// Minimum gap between emails of the same kind to the same user.
const RESEND_COOLDOWN_MS = 60 * 1000;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

// Returns the raw token to put in the emailed link, or null if one was issued
// less than a minute ago (the caller then skips sending).
export async function issueToken(
  userId: string,
  type: AuthTokenType,
  options: { newEmail?: string } = {},
): Promise<string | null> {
  const latest = await prisma.authToken.findFirst({
    where: { userId, type },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) return null;

  const token = randomBytes(32).toString('base64url');
  // Older links stop working as soon as a new one is requested.
  await prisma.$transaction([
    prisma.authToken.deleteMany({ where: { userId, type, usedAt: null } }),
    prisma.authToken.create({
      data: {
        userId,
        type,
        tokenHash: hashToken(token),
        newEmail: options.newEmail,
        expiresAt: new Date(Date.now() + TTL_MS[type]),
      },
    }),
  ]);
  return token;
}

// Single-use: the conditional updateMany is what lets only one request win if
// the same link is submitted twice at once.
export async function consumeToken(token: string, type: AuthTokenType) {
  if (!token) return null;
  const tokenHash = hashToken(token);

  const { count } = await prisma.authToken.updateMany({
    where: { tokenHash, type, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (count === 0) return null;

  return prisma.authToken.findUnique({
    where: { tokenHash },
    select: { userId: true, newEmail: true },
  });
}

// Read-only check, so a page can say "this link is invalid" before showing a form.
export async function isTokenUsable(token: string, type: AuthTokenType) {
  if (!token) return false;
  const row = await prisma.authToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { type: true, usedAt: true, expiresAt: true },
  });
  return Boolean(row && row.type === type && !row.usedAt && row.expiresAt > new Date());
}

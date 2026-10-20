'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/session';
import type { FormState } from '@/lib/auth/types';
import { MAX_SAVED_ADDRESSES } from '@/lib/checkout/address';
import { prisma } from '@/lib/prisma';
import { savedAddressSchema } from '@/lib/validation/checkout';

const TEXT_FIELDS = ['fullName', 'address', 'city', 'province', 'zip', 'phone', 'label'] as const;

class AddressLimitError extends Error {}
class AddressNotFoundError extends Error {}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function refresh() {
  revalidatePath('/account/addresses');
  revalidatePath('/check-out');
}

// Create (no `id`) or update (with `id`). Server Actions are reachable by direct
// POST, so ownership is enforced in every query, not by the page that rendered.
export async function saveAddress(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser('/account/addresses');

  const id = text(formData, 'id');
  const wantsDefault = text(formData, 'isDefault') === 'on';
  // Echoed back on errors so typed text survives the form reset React does after an action.
  const values: Record<string, string> = {
    ...Object.fromEntries(TEXT_FIELDS.map((key) => [key, text(formData, key)])),
    isDefault: wantsDefault ? 'on' : '',
  };

  const parsed = savedAddressSchema.safeParse({ ...values, isDefault: wantsDefault });
  if (!parsed.success) {
    return { values, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { isDefault, ...fields } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      let makeDefault = isDefault;

      if (id) {
        const existing = await tx.savedAddress.findFirst({
          where: { id, userId: user.id },
          select: { isDefault: true },
        });
        if (!existing) throw new AddressNotFoundError();
        // There is always a default; promote another address to change it.
        makeDefault = isDefault || existing.isDefault;
      } else {
        const count = await tx.savedAddress.count({ where: { userId: user.id } });
        if (count >= MAX_SAVED_ADDRESSES) throw new AddressLimitError();
        makeDefault = isDefault || count === 0;
      }

      if (makeDefault) {
        await tx.savedAddress.updateMany({
          where: { userId: user.id, isDefault: true, ...(id ? { id: { not: id } } : {}) },
          data: { isDefault: false },
        });
      }

      if (id) {
        await tx.savedAddress.update({ where: { id }, data: { ...fields, isDefault: makeDefault } });
      } else {
        await tx.savedAddress.create({ data: { ...fields, userId: user.id, isDefault: makeDefault } });
      }
    });
  } catch (error) {
    if (error instanceof AddressLimitError) {
      return { values, error: `You can save up to ${MAX_SAVED_ADDRESSES} addresses. Delete one to add another.` };
    }
    if (error instanceof AddressNotFoundError) {
      return { values, error: 'We couldn’t find that address. It may have been deleted.' };
    }
    throw error;
  }

  refresh();
  redirect('/account/addresses');
}

export async function deleteAddress(formData: FormData) {
  const user = await requireUser('/account/addresses');
  const id = text(formData, 'id');
  if (!id) return;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.savedAddress.findFirst({ where: { id, userId: user.id }, select: { isDefault: true } });
    if (!existing) return;

    await tx.savedAddress.delete({ where: { id } });

    // Don't leave the book without a default.
    if (existing.isDefault) {
      const next = await tx.savedAddress.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (next) await tx.savedAddress.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });

  refresh();
}

export async function setDefaultAddress(formData: FormData) {
  const user = await requireUser('/account/addresses');
  const id = text(formData, 'id');
  if (!id) return;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.savedAddress.findFirst({ where: { id, userId: user.id }, select: { id: true } });
    if (!existing) return;

    await tx.savedAddress.updateMany({ where: { userId: user.id, id: { not: id } }, data: { isDefault: false } });
    await tx.savedAddress.update({ where: { id }, data: { isDefault: true } });
  });

  refresh();
}

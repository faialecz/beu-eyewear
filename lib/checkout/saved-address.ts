import 'server-only';

import type { AddressFields } from '@/lib/checkout/address';
import { prisma } from '@/lib/prisma';

export interface SavedAddressRecord extends AddressFields {
  id: string;
  label: string | null;
  isDefault: boolean;
}

const SELECT = {
  id: true,
  label: true,
  isDefault: true,
  fullName: true,
  address: true,
  city: true,
  province: true,
  zip: true,
  phone: true,
} as const;

// Default first, then newest. Only plain fields (no userId), so the result is
// safe to hand to a client component.
export async function getSavedAddresses(userId: string): Promise<SavedAddressRecord[]> {
  return prisma.savedAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    select: SELECT,
  });
}

// Scoped by userId so one user can never load another's address by id.
export async function getSavedAddress(userId: string, id: string): Promise<SavedAddressRecord | null> {
  return prisma.savedAddress.findFirst({ where: { id, userId }, select: SELECT });
}

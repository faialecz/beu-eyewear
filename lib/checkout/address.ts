// Shared by the checkout form (input limits) and the zod schema (authoritative
// check). No 'use client'/'server-only' on purpose so both sides can import it.
export const ADDRESS_LIMITS = {
  fullName: 100,
  address: 255,
  city: 50,
  province: 50,
  zip: 4,
  phone: 11,
} as const;

// The shipping address fields, as the checkout form prefills them.
export interface AddressFields {
  fullName: string;
  address: string;
  city: string;
  province: string;
  zip: string;
  phone: string;
}

// For typing/pasting into an input: keep digits and cut off at `max`.
export function digitsOnly(value: string, max: number): string {
  return value.replace(/\D/g, '').slice(0, max);
}

// Philippine mobiles are 11 digits starting with 09. A pasted international
// form (+63 917 123 4567 -> 639171234567) is converted rather than rejected.
//
// Deliberately does NOT truncate: the server validates the result, so an
// over-long number must fail rather than be silently cut to 11 digits. The
// input handler truncates separately.
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return /^63\d{10}$/.test(digits) ? `0${digits.slice(2)}` : digits;
}

// How many addresses one account can keep in the address book.
export const MAX_SAVED_ADDRESSES = 5;

// Optional nickname such as "Home" or "Office".
export const ADDRESS_LABEL_MAX = 30;

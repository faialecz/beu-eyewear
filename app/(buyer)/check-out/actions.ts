'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/session';
import { MAX_SAVED_ADDRESSES } from '@/lib/checkout/address';
import { calcTotals } from '@/lib/checkout/pricing';
import type { PlaceOrderState } from '@/lib/checkout/types';
import { prisma } from '@/lib/prisma';
import { checkoutSchema } from '@/lib/validation/checkout';

// Thrown inside the order transaction so the stock decrements roll back with it.
class OutOfStockError extends Error {
  constructor(readonly productName: string) {
    super(`${productName} is out of stock`);
  }
}

function stockMessage(name: string, available: number) {
  return available <= 0
    ? `${name} just sold out. Please remove it from your cart and try again.`
    : `${name} only has ${available} left in stock. Please lower the quantity in your cart and try again.`;
}

const TEXT_FIELDS = ['fullName', 'address', 'city', 'province', 'zip', 'phone'] as const;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export async function placeOrder(_prevState: PlaceOrderState, formData: FormData): Promise<PlaceOrderState> {
  // Server Actions are reachable by direct POST, so authenticate here rather
  // than relying on the page having been gated.
  const user = await requireUser();

  const saveAddress = text(formData, 'saveAddress') === 'on';
  // Echoed back on errors so the typed address (and the checkbox) survive the
  // form reset React does after an action.
  const values: Record<string, string> = {
    ...Object.fromEntries(TEXT_FIELDS.map((key) => [key, text(formData, key)])),
    saveAddress: saveAddress ? 'on' : '',
  };

  let rawLines: unknown;
  try {
    rawLines = JSON.parse(text(formData, 'lines') || '[]');
  } catch {
    return { values, error: 'We couldn’t read your cart. Please refresh the page and try again.' };
  }

  const parsed = checkoutSchema.safeParse({
    ...Object.fromEntries(TEXT_FIELDS.map((key) => [key, values[key]])),
    shippingMethod: text(formData, 'shippingMethod'),
    paymentMethod: text(formData, 'paymentMethod'),
    lines: rawLines,
  });
  if (!parsed.success) {
    return { values, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const { lines, shippingMethod, paymentMethod, ...address } = parsed.data;

  // The client only says *what* to buy. Names, prices and which colors exist
  // all come from the database.
  const products = await prisma.product.findMany({
    where: { slug: { in: [...new Set(lines.map((line) => line.slug))] } },
    select: { slug: true, name: true, price: true, colors: true, stockQuantity: true },
  });
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  const items: { productSlug: string; name: string; color: string | null; unitPrice: number; quantity: number }[] = [];
  for (const line of lines) {
    const product = bySlug.get(line.slug);
    if (!product) {
      return { values, error: 'Some items in your cart are no longer available. Please review your cart and try again.' };
    }

    const color = line.color || undefined;
    if (!color && product.colors.length > 0) {
      return { values, error: `Please choose a color for ${product.name} in your cart.` };
    }
    if (color && !product.colors.includes(color)) {
      return { values, error: `${product.name} is no longer available in that color. Please update your cart.` };
    }

    items.push({
      productSlug: product.slug,
      name: product.name,
      color: color ?? null,
      unitPrice: product.price,
      quantity: line.quantity,
    });
  }

  // The same product can be in the cart in several colors; stock is per product.
  const demand = new Map<string, number>();
  for (const item of items) {
    demand.set(item.productSlug, (demand.get(item.productSlug) ?? 0) + item.quantity);
  }
  for (const [slug, quantity] of demand) {
    const product = bySlug.get(slug)!;
    if (product.stockQuantity < quantity) {
      return { values, error: stockMessage(product.name, product.stockQuantity) };
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totals = calcTotals(subtotal, shippingMethod);

  let orderId: string;
  try {
    // One transaction: the stock decrements and the order (with its items) all
    // happen or none do. The conditional updateMany is what stops two buyers
    // checking out the last item at the same time — the loser gets count 0.
    const order = await prisma.$transaction(async (tx) => {
      for (const [slug, quantity] of demand) {
        const { count } = await tx.product.updateMany({
          where: { slug, stockQuantity: { gte: quantity } },
          data: { stockQuantity: { decrement: quantity } },
        });
        if (count === 0) throw new OutOfStockError(bySlug.get(slug)!.name);
      }

      return tx.order.create({
        data: {
          userId: user.id,
          shippingMethod,
          paymentMethod,
          ...totals,
          shipName: address.fullName,
          shipAddress: address.address,
          shipCity: address.city,
          shipProvince: address.province,
          shipZip: address.zip,
          shipPhone: address.phone,
          items: { create: items },
        },
        select: { id: true },
      });
    });
    orderId = order.id;
  } catch (error) {
    if (error instanceof OutOfStockError) {
      return { values, error: stockMessage(error.productName, 0) };
    }
    console.error('placeOrder failed', error);
    return { values, error: 'We couldn’t place your order. Please try again.' };
  }

  // After the order exists, and best-effort: a failure here must not turn a
  // placed order into an error the buyer would retry (and double-order).
  if (saveAddress) {
    try {
      const { fullName, address: street, city, province, zip, phone } = address;
      const fields = { fullName, address: street, city, province, zip, phone };
      await prisma.$transaction(async (tx) => {
        const saved = await tx.savedAddress.findMany({
          where: { userId: user.id },
          select: { fullName: true, address: true, city: true, province: true, zip: true, phone: true },
        });
        if (saved.length >= MAX_SAVED_ADDRESSES) return;
        // Ordering the same address twice shouldn't fill the address book.
        if (saved.some((existing) => TEXT_FIELDS.every((key) => existing[key] === fields[key]))) return;

        await tx.savedAddress.create({
          data: { userId: user.id, ...fields, isDefault: saved.length === 0 },
        });
      });
      revalidatePath('/account/addresses');
    } catch (error) {
      console.error('saving address failed', error);
    }
  }

  revalidatePath('/account/orders');
  return { orderId };
}

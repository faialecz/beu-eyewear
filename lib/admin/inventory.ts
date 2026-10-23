import 'server-only';

import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { LOW_STOCK_THRESHOLD, MAX_STOCK } from './config';

export interface StockFormState {
  error?: string;
  message?: string;
  values?: { mode: string; amount: string };
}

export const stockAdjustmentSchema = z.object({
  slug: z.string().trim().min(1).max(80),
  mode: z.enum(['set', 'delta']),
  amount: z.string().trim().regex(/^[+-]?\d+$/, 'Enter a whole number, such as 10 or -2.')
    .transform(Number).pipe(z.number().int().min(-MAX_STOCK).max(MAX_STOCK)),
}).refine((data) => data.mode !== 'set' || data.amount >= 0, {
  message: 'Stock must be between 0 and 100,000.', path: ['amount'],
});

export type InventoryFilter = 'all' | 'low' | 'out';

export function parseInventoryFilters(params: Record<string, string | string[] | undefined>) {
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 120) : '';
  const filter: InventoryFilter = params.filter === 'low' || params.filter === 'out' ? params.filter : 'all';
  return { q, filter };
}

export async function getInventory({ q, filter }: { q: string; filter: InventoryFilter }) {
  const where: Prisma.ProductWhereInput = {
    ...(q && { name: { contains: q, mode: 'insensitive' } }),
    ...(filter === 'low' && { stockQuantity: { gt: 0, lte: LOW_STOCK_THRESHOLD } }),
    ...(filter === 'out' && { stockQuantity: { lte: 0 } }),
  };
  return prisma.product.findMany({
    where,
    orderBy: [{ name: 'asc' }, { slug: 'asc' }],
    select: {
      slug: true, name: true, stockQuantity: true,
      category: { select: { name: true } },
      subcategory: { select: { name: true } },
    },
  });
}

export async function applyStockAdjustment(data: z.infer<typeof stockAdjustmentSchema>) {
  // A single conditional UPDATE checks the current stock while taking the row lock.
  // Concurrent deltas cannot take stock below zero or above the upper limit.
  const { slug, mode, amount } = data;
  const result = await prisma.product.updateMany({
    where: {
      slug,
      ...(mode === 'delta' && { stockQuantity: { gte: Math.max(0, -amount), lte: Math.min(MAX_STOCK, MAX_STOCK - amount) } }),
    },
    data: { stockQuantity: mode === 'set' ? amount : { increment: amount } },
  });
  return result.count === 1;
}

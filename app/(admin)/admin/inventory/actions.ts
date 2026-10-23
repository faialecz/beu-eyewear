'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import { applyStockAdjustment, stockAdjustmentSchema, type StockFormState } from '@/lib/admin/inventory';

export async function adjustStock(slug: string, _previous: StockFormState, formData: FormData): Promise<StockFormState> {
  await requireAdmin();
  const values = {
    mode: typeof formData.get('mode') === 'string' ? String(formData.get('mode')) : '',
    amount: typeof formData.get('amount') === 'string' ? String(formData.get('amount')) : '',
  };
  const parsed = stockAdjustmentSchema.safeParse({ slug, ...values });
  if (!parsed.success) return { values, error: 'Use a whole number from 0 to 100,000 for Set stock, or -100,000 to +100,000 for Adjust by.' };
  try {
    if (!await applyStockAdjustment(parsed.data)) {
      return { values, error: 'This product no longer exists, or this adjustment would put stock outside 0–100,000. Refresh and try again.' };
    }
  } catch {
    return { values, error: 'We couldn’t adjust stock. Please try again.' };
  }
  for (const path of ['/admin/inventory', '/admin', '/admin/products', `/admin/products/${parsed.data.slug}`, '/home', '/listing', '/search', '/cart', '/check-out', '/account/wishlist']) {
    revalidatePath(path);
  }
  // Detail pages also show stock for related products, so invalidate the pattern.
  revalidatePath('/listing/[slug]', 'page');
  return { message: 'Stock updated.' };
}

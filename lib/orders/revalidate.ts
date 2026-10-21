import 'server-only';

import { revalidatePath } from 'next/cache';

// Everything an order change can show up on: both order screens, plus the stock
// figures a cancel puts back.
export function revalidateOrderViews(id: string) {
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath('/admin/customers');
  revalidatePath('/admin/customers/[id]', 'page');
  revalidatePath('/admin/products');
  revalidatePath('/admin/inventory');
  revalidatePath('/account/orders');
  revalidatePath(`/account/orders/${id}`);
  revalidatePath('/listing');
}

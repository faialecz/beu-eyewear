'use server';

import { requireUser } from '@/lib/auth/session';
import type { FormState } from '@/lib/auth/types';
import { revalidateOrderViews } from '@/lib/orders/revalidate';
import { cancelOrder } from '@/lib/orders/transitions';

// Same rules as the admin cancel (lib/orders/rules.ts), scoped to the owner so
// someone else's order id just reads as "not found".
export async function cancelMyOrder(id: string): Promise<FormState> {
  const user = await requireUser(`/account/orders/${id}`);
  try {
    const result = await cancelOrder(id, { userId: user.id });
    revalidateOrderViews(id);
    return result.ok ? { success: result.message } : { error: result.error };
  } catch (error) {
    console.error('cancelMyOrder failed', error);
    return { error: 'Something went wrong. Please try again.' };
  }
}

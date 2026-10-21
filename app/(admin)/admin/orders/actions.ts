'use server';

import { requireAdmin } from '@/lib/auth/session';
import type { FormState } from '@/lib/auth/types';
import { revalidateOrderViews } from '@/lib/orders/revalidate';
import { advanceOrder, cancelOrder, markOrderPaid, type TransitionResult } from '@/lib/orders/transitions';

// Actions are public POST endpoints, so each one checks the admin itself rather
// than relying on the layout. Bound to an order id and used with useActionState.

function toState(result: TransitionResult, id: string): FormState {
  revalidateOrderViews(id);
  return result.ok ? { success: result.message } : { error: result.error };
}

export async function advanceOrderStatus(id: string): Promise<FormState> {
  await requireAdmin();
  try {
    return toState(await advanceOrder(id), id);
  } catch (error) {
    console.error('advanceOrderStatus failed', error);
    return { error: 'Something went wrong. Please try again.' };
  }
}

export async function markOrderPaidAction(id: string): Promise<FormState> {
  await requireAdmin();
  try {
    return toState(await markOrderPaid(id), id);
  } catch (error) {
    console.error('markOrderPaidAction failed', error);
    return { error: 'Something went wrong. Please try again.' };
  }
}

export async function cancelOrderAsAdmin(id: string): Promise<FormState> {
  await requireAdmin();
  try {
    return toState(await cancelOrder(id), id);
  } catch (error) {
    console.error('cancelOrderAsAdmin failed', error);
    return { error: 'Something went wrong. Please try again.' };
  }
}

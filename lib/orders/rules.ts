import type { OrderStatus, PaymentStatus } from '@prisma/client';

// The one rule set for order changes. Server actions enforce it and the UI reads
// it to decide which buttons to show, so the two can't drift apart.
// Kept free of server-only imports so client components can use it too.

export interface OrderState {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}

export const STATUS_FLOW = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const satisfies readonly OrderStatus[];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  UNPAID: 'Unpaid',
  PAID: 'Paid',
};

// Cancelling is only possible before the order ships, and never once it is paid.
// There is no refund flow yet, so a paid order can't be cancelled by anyone.
export const CANCELLABLE_STATUSES = ['PENDING', 'PROCESSING'] as const satisfies readonly OrderStatus[];

// One step forward, no skipping and no going back. null once there is nowhere to go.
export function nextStatus(status: OrderStatus): OrderStatus | null {
  const index = STATUS_FLOW.indexOf(status as (typeof STATUS_FLOW)[number]);
  if (index === -1) return null;
  return STATUS_FLOW[index + 1] ?? null;
}

export function canAdvance(order: OrderState): boolean {
  return nextStatus(order.status) !== null;
}

export function canCancel(order: OrderState): boolean {
  return (CANCELLABLE_STATUSES as readonly OrderStatus[]).includes(order.status) && order.paymentStatus === 'UNPAID';
}

export function canMarkPaid(order: OrderState): boolean {
  return order.paymentStatus === 'UNPAID' && order.status !== 'CANCELLED';
}

// Why cancel isn't available, for the UI. null when it is available or when
// nothing needs explaining (already cancelled or delivered).
export function cancelBlockedReason(order: OrderState): string | null {
  if (canCancel(order)) return null;
  if (order.status === 'CANCELLED' || order.status === 'DELIVERED') return null;
  if (order.status === 'SHIPPED') return "This order has already shipped, so it can't be cancelled.";
  if (order.paymentStatus === 'PAID') return "This order has been paid, so it can't be cancelled.";
  return "This order can't be cancelled.";
}

import type { OrderStatus, PaymentStatus } from '@prisma/client';
import { PAYMENT_LABELS, STATUS_LABELS } from '@/lib/orders/rules';

const base = 'inline-block rounded-full px-2 py-0.5 text-xs font-semibold';

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-500/15 text-amber-600',
  PROCESSING: 'bg-blue-500/15 text-blue-600',
  SHIPPED: 'bg-violet-500/15 text-violet-600',
  DELIVERED: 'bg-green-500/15 text-green-600',
  CANCELLED: 'bg-red-500/15 text-red-600',
};

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  UNPAID: 'bg-amber-500/15 text-amber-600',
  PAID: 'bg-green-500/15 text-green-600',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`${base} ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <span className={`${base} ${PAYMENT_STYLES[status]}`}>{PAYMENT_LABELS[status]}</span>;
}

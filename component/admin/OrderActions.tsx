'use client';

import { useActionState } from 'react';
import type { OrderStatus, PaymentStatus } from '@prisma/client';
import { advanceOrderStatus, cancelOrderAsAdmin, markOrderPaidAction } from '@/app/(admin)/admin/orders/actions';
import { buttonClassName } from '@/component/Button';
import CancelOrderButton from '@/component/order/CancelOrderButton';
import type { FormState } from '@/lib/auth/types';
import { STATUS_LABELS, canMarkPaid, cancelBlockedReason, canCancel, nextStatus } from '@/lib/orders/rules';

export interface OrderActionsProps {
  orderId: string;
  orderLabel: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}

function ActionButton({
  action,
  label,
  pendingLabel,
}: {
  action: () => Promise<FormState>;
  label: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(async () => action(), {} as FormState);
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div>
        <button type="submit" disabled={pending} className={buttonClassName({ variant: 'primary' })}>
          {pending ? pendingLabel : label}
        </button>
      </div>
      <div aria-live="polite" className="text-sm">
        {state.error && <p className="text-red-500">{state.error}</p>}
        {state.success && <p className="text-green-600">{state.success}</p>}
      </div>
    </form>
  );
}

// Which buttons show comes entirely from lib/orders/rules.ts, the same rules the
// server actions enforce.
export default function OrderActions({ orderId, orderLabel, status, paymentStatus }: OrderActionsProps) {
  const order = { status, paymentStatus };
  const next = nextStatus(status);
  const blockedReason = cancelBlockedReason(order);

  if (!next && !canMarkPaid(order) && !canCancel(order)) {
    return <p className="text-sm text-muted-foreground">No further actions for this order.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {next && (
        <ActionButton
          action={advanceOrderStatus.bind(null, orderId)}
          label={`Mark as ${STATUS_LABELS[next]}`}
          pendingLabel="Updating…"
        />
      )}
      {canMarkPaid(order) && (
        <ActionButton
          action={markOrderPaidAction.bind(null, orderId)}
          label="Mark as paid"
          pendingLabel="Updating…"
        />
      )}
      {canCancel(order) && <CancelOrderButton action={cancelOrderAsAdmin.bind(null, orderId)} orderLabel={orderLabel} />}
      {blockedReason && <p className="text-xs text-muted-foreground">{blockedReason}</p>}
    </div>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import CancelOrderButton from '@/component/order/CancelOrderButton';
import OrderStatusBadge from '@/component/order/OrderStatusBadge';
import OrderStatusSteps from '@/component/order/OrderStatusSteps';
import OrderSummaryCard from '@/component/order/OrderSummaryCard';
import ShippingInfoCard from '@/component/order/ShippingInfoCard';
import { requireUser } from '@/lib/auth/session';
import { formatOrderNumber } from '@/lib/format';
import { getOrderForUser } from '@/lib/orders/queries';
import { cancelBlockedReason, canCancel } from '@/lib/orders/rules';
import { orderBucket } from '@/lib/orders/tabs';
import { cancelMyOrder } from '../actions';

export default async function OrderDetailPage(props: PageProps<'/account/orders/[id]'>) {
  const { id } = await props.params;
  const user = await requireUser(`/account/orders/${id}`);

  // Scoped to the signed-in user, so someone else's order id is just a 404.
  const order = await getOrderForUser(user.id, id);
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft size={16} />
          Order History
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">Order {formatOrderNumber(order.number)}</h1>
          <OrderStatusBadge bucket={orderBucket(order)} />
        </div>
        {order.paymentStatus === 'UNPAID' && order.status !== 'CANCELLED' && (
          <p className="mt-2 text-sm text-muted-foreground">Payment pending — we&apos;ll start processing once it&apos;s received.</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <OrderStatusSteps status={order.status} />
          <ShippingInfoCard order={order} />
          {canCancel(order) ? (
            <CancelOrderButton action={cancelMyOrder.bind(null, order.id)} orderLabel={formatOrderNumber(order.number)} />
          ) : (
            cancelBlockedReason(order) && <p className="text-sm text-muted-foreground">{cancelBlockedReason(order)}</p>
          )}
        </div>
        <OrderSummaryCard order={order} />
      </div>
    </div>
  );
}

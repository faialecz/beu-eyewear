import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import OrderActions from '@/component/admin/OrderActions';
import { OrderStatusBadge, PaymentStatusBadge } from '@/component/admin/OrderStatusBadge';
import OrderStatusSteps from '@/component/order/OrderStatusSteps';
import ShippingInfoCard from '@/component/order/ShippingInfoCard';
import { PAYMENT_METHOD_LABELS } from '@/lib/checkout/payment';
import { formatOrderNumber, formatPrice } from '@/lib/format';
import { getAdminOrder } from '@/lib/orders/admin-queries';

// Admin data must always be fresh — never a static build-time snapshot.
export const dynamic = 'force-dynamic';

function formatDateTime(date: Date) {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Manila',
  });
}

export default async function AdminOrderDetailPage(props: PageProps<'/admin/orders/[id]'>) {
  const { id } = await props.params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const orderLabel = formatOrderNumber(order.number);
  const timeline = [
    { label: 'Placed', at: order.createdAt },
    { label: 'Paid', at: order.paidAt },
    { label: 'Shipped', at: order.shippedAt },
    { label: 'Delivered', at: order.deliveredAt },
    { label: 'Cancelled', at: order.cancelledAt },
  ].filter((event): event is { label: string; at: Date } => event.at !== null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft size={16} />
          Orders
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">Order {orderLabel}</h1>
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-xl border border-border p-6">
            <OrderStatusSteps status={order.status} />
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold">Color</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Qty</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.color ?? '—'}</td>
                    <td className="px-4 py-3">{formatPrice(item.unitPrice)}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">{formatPrice(item.unitPrice * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="text-sm">
                <tr className="border-t border-border">
                  <td colSpan={4} className="px-4 py-2 text-right text-muted-foreground">
                    Subtotal
                  </td>
                  <td className="px-4 py-2 text-right">{formatPrice(order.subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-right text-muted-foreground">
                    Shipping
                  </td>
                  <td className="px-4 py-2 text-right">{order.shippingFee === 0 ? 'Free' : formatPrice(order.shippingFee)}</td>
                </tr>
                <tr className="font-bold">
                  <td colSpan={4} className="px-4 py-3 text-right">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right">{formatPrice(order.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <ShippingInfoCard order={order} />
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border p-6">
            <p className="text-sm font-semibold uppercase tracking-wide">Actions</p>
            <div className="mt-4">
              <OrderActions
                orderId={order.id}
                orderLabel={orderLabel}
                status={order.status}
                paymentStatus={order.paymentStatus}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border p-6">
            <p className="text-sm font-semibold uppercase tracking-wide">Customer</p>
            <Link href={`/admin/customers/${order.user.id}`} className="mt-3 block text-sm font-semibold hover:underline">
              {order.user.name}
            </Link>
            <p className="text-sm text-muted-foreground">{order.user.email}</p>
          </div>

          <div className="rounded-xl border border-border p-6">
            <p className="text-sm font-semibold uppercase tracking-wide">Payment</p>
            <p className="mt-3 text-sm">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
            <p className="text-sm text-muted-foreground">
              {order.paymentStatus === 'PAID' ? 'Paid (recorded by hand)' : 'Awaiting payment'}
            </p>
          </div>

          <div className="rounded-xl border border-border p-6">
            <p className="text-sm font-semibold uppercase tracking-wide">Timeline</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {timeline.map((event) => (
                <li key={event.label} className="flex justify-between gap-3">
                  <span className="font-medium">{event.label}</span>
                  <span className="text-muted-foreground">{formatDateTime(event.at)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

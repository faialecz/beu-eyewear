import Link from 'next/link';
import { buttonClassName } from '@/component/Button';
import { OrderStatusBadge, PaymentStatusBadge } from '@/component/admin/OrderStatusBadge';
import Pagination from '@/component/admin/Pagination';
import { formatOrderNumber, formatPrice } from '@/lib/format';
import {
  ORDER_STATUS_FILTERS,
  PAYMENT_STATUS_FILTERS,
  getAdminOrders,
  parseOrderStatus,
  parsePaymentStatus,
} from '@/lib/orders/admin-queries';
import { PAYMENT_LABELS, STATUS_LABELS } from '@/lib/orders/rules';

// Admin data must always be fresh — never a static build-time snapshot.
export const dynamic = 'force-dynamic';

const filterClassName = 'rounded-lg border border-border bg-background px-3 py-2 text-sm';

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' });
}

export default async function AdminOrdersPage(props: PageProps<'/admin/orders'>) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === 'string' ? searchParams.q.trim() : '';
  const status = parseOrderStatus(searchParams.status);
  const payment = parsePaymentStatus(searchParams.payment);
  const requestedPage = Number(typeof searchParams.page === 'string' ? searchParams.page : 1);

  const { orders, filteredCount, totalCount, page, totalPages } = await getAdminOrders({
    q,
    status,
    payment,
    page: Number.isInteger(requestedPage) ? requestedPage : 1,
  });
  const isFiltered = Boolean(q || status || payment);

  // Filters carried into every pagination link.
  const params: Record<string, string> = {
    ...(q && { q }),
    ...(status && { status }),
    ...(payment && { payment }),
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Orders</h1>

      {/* Plain GET form: filters live in the URL, so they survive refresh and can be shared. */}
      <form className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Order #, customer name or email"
          aria-label="Search orders"
          className={`${filterClassName} w-72`}
        />
        <select name="status" defaultValue={status ?? ''} aria-label="Filter by status" className={filterClassName}>
          <option value="">All statuses</option>
          {ORDER_STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select name="payment" defaultValue={payment ?? ''} aria-label="Filter by payment" className={filterClassName}>
          <option value="">All payments</option>
          {PAYMENT_STATUS_FILTERS.map((p) => (
            <option key={p} value={p}>
              {PAYMENT_LABELS[p]}
            </option>
          ))}
        </select>
        <button type="submit" className={buttonClassName({ variant: 'secondary' })}>
          Filter
        </button>
        {isFiltered && (
          <Link href="/admin/orders" className="text-sm text-muted-foreground underline hover:text-foreground">
            Clear
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Items</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Payment</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                    {formatOrderNumber(order.number)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${order.user.id}`} className="hover:underline">
                    {order.user.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{order.user.email}</p>
                </td>
                <td className="px-4 py-3">{order._count.items}</td>
                <td className="px-4 py-3">{formatPrice(order.total)}</td>
                <td className="px-4 py-3">
                  <PaymentStatusBadge status={order.paymentStatus} />
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/orders/${order.id}`} className="underline hover:text-foreground">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  {isFiltered ? 'No orders match your filters.' : 'No orders yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {isFiltered ? `${filteredCount} of ${totalCount} orders.` : `${totalCount} orders.`}
        </p>
        <Pagination basePath="/admin/orders" params={params} page={page} totalPages={totalPages} />
      </div>
    </div>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { OrderStatusBadge, PaymentStatusBadge } from '@/component/admin/OrderStatusBadge';
import { getCustomer } from '@/lib/customers/queries';
import { formatOrderNumber, formatPrice } from '@/lib/format';

// Admin data must always be fresh — never a static build-time snapshot.
export const dynamic = 'force-dynamic';

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' });
}

export default async function CustomerDetailPage(props: PageProps<'/admin/customers/[id]'>) {
  const { id } = await props.params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const stats = [
    { label: 'Orders', value: String(customer.orders.length) },
    { label: 'Total spent', value: formatPrice(customer.totalSpent) },
    { label: 'Last order', value: customer.orders[0] ? formatDate(customer.orders[0].createdAt) : '—' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/customers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft size={16} />
          Customers
        </Link>
        <h1 className="mt-3 text-2xl font-bold">{customer.name}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-lg font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Items</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                        {formatOrderNumber(order.number)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">{order._count.items}</td>
                    <td className="px-4 py-3">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
                {customer.orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      This customer hasn&apos;t placed any orders.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border p-6">
            <p className="text-sm font-semibold uppercase tracking-wide">Profile</p>
            <p className="mt-3 text-sm">{customer.email}</p>
            <p className="text-sm text-muted-foreground">
              {customer.emailVerifiedAt ? `Verified ${formatDate(customer.emailVerifiedAt)}` : 'Email not verified'}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">Joined {formatDate(customer.createdAt)}</p>
          </div>

          <div className="rounded-xl border border-border p-6">
            <p className="text-sm font-semibold uppercase tracking-wide">Saved addresses</p>
            {customer.savedAddresses.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No saved addresses.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-4">
                {customer.savedAddresses.map((address) => (
                  <li key={address.id} className="text-sm">
                    <p className="font-semibold">
                      {address.label || address.fullName}
                      {address.isDefault && (
                        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">Default</span>
                      )}
                    </p>
                    <p className="text-muted-foreground">{address.fullName}</p>
                    <p className="text-muted-foreground">{address.address}</p>
                    <p className="text-muted-foreground">
                      {address.city}, {address.province} {address.zip}
                    </p>
                    <p className="text-muted-foreground">{address.phone}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

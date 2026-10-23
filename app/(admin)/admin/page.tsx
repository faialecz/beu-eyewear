import Link from 'next/link';
import DashboardStatCard from '@/component/admin/DashboardStatCard';
import SalesTrendChart from '@/component/admin/SalesTrendChart';
import { OrderStatusBadge } from '@/component/admin/OrderStatusBadge';
import { requireAdmin } from '@/lib/auth/session';
import { getDashboard } from '@/lib/admin/dashboard';
import { LOW_STOCK_THRESHOLD } from '@/lib/admin/config';
import { formatOrderNumber, formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await requireAdmin();
  const data = await getDashboard();
  const count = (value: number) => value.toLocaleString('en-PH');
  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-2xl font-bold">Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">All-time totals. Revenue uses stored order totals, including shipping.</p></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardStatCard label="Revenue (excl. cancelled)" value={formatPrice(data.revenue)} note="All non-cancelled orders, including unpaid orders" />
        <DashboardStatCard label="Paid revenue" value={formatPrice(data.paidRevenue)} note="Paid orders only; excludes cancelled orders" />
        <DashboardStatCard label="Total orders" value={count(data.totalOrders)} note="All statuses, including cancelled orders" />
        <DashboardStatCard label="Orders waiting for action" value={count(data.waitingOrders)} note="Pending + Processing · View Orders" href="/admin/orders" />
        <DashboardStatCard label={`Low stock (1–${LOW_STOCK_THRESHOLD})`} value={count(data.lowStock)} note="Products · View filtered Inventory" href="/admin/inventory?filter=low" />
        <DashboardStatCard label="Out of stock (0)" value={count(data.outOfStock)} note="Products · View filtered Inventory" href="/admin/inventory?filter=out" />
      </div>
      {data.totalOrders === 0 && <p className="rounded-xl border border-border p-5 text-sm text-muted-foreground">No orders yet. Sales will appear here when orders are placed.</p>}
      <section className="rounded-xl border border-border bg-background p-5" aria-labelledby="sales-trend-title">
        <h2 id="sales-trend-title" className="text-sm font-semibold uppercase tracking-wide">Sales trend · Last 30 days</h2>
        <p className="mb-5 mt-1 text-xs text-muted-foreground">{data.startDate} to {data.endDate} · Asia/Manila · Revenue includes shipping. Each series uses its own labeled axis.</p>
        <SalesTrendChart data={data.trend} />
      </section>
      <section className="rounded-xl border border-border bg-background" aria-labelledby="recent-orders-title">
        <div className="flex items-center justify-between gap-3 p-5"><h2 id="recent-orders-title" className="text-sm font-semibold uppercase tracking-wide">Recent orders</h2><Link href="/admin/orders" className="text-sm underline">View all</Link></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead><tr className="border-b border-border text-muted-foreground"><th scope="col" className="px-5 py-3">Number</th><th scope="col" className="px-5 py-3">Customer</th><th scope="col" className="px-5 py-3 text-right">Total</th><th scope="col" className="px-5 py-3">Status</th></tr></thead>
          <tbody>{data.recentOrders.map((order) => <tr key={order.id} className="border-b border-border last:border-0"><td className="whitespace-nowrap px-5 py-3"><Link className="underline" href={`/admin/orders/${order.id}`}>{formatOrderNumber(order.number)}</Link></td><td className="px-5 py-3">{order.user.name}</td><td className="px-5 py-3 text-right tabular-nums">{formatPrice(order.total)}</td><td className="px-5 py-3"><OrderStatusBadge status={order.status} /></td></tr>)}
            {data.recentOrders.length === 0 && <tr><td colSpan={4} className="px-5 py-6 text-center text-muted-foreground">No recent orders.</td></tr>}
          </tbody>
        </table></div>
      </section>
    </div>
  );
}

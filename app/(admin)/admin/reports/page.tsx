import { buttonClassName } from '@/component/Button';
import DashboardStatCard from '@/component/admin/DashboardStatCard';
import ReportFilters from '@/component/admin/ReportFilters';
import RevenueBarChart from '@/component/admin/RevenueBarChart';
import { requireAdmin } from '@/lib/auth/session';
import { defaultSalesDates, parseSalesRange, salesRangeParams } from '@/lib/admin/dates';
import { getReports, reportPeriodLabel, type ProductSales } from '@/lib/admin/reports';
import { formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';
const cell = 'px-4 py-3';
const numeric = `${cell} text-right tabular-nums`;

function ProductTable({ rows }: { rows: ProductSales[] }) {
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border text-muted-foreground"><th scope="col" className={cell}>Product</th><th scope="col" className={numeric}>Units</th><th scope="col" className={numeric}>Item revenue</th></tr></thead><tbody>
    {rows.map((row) => <tr key={row.slug} className="border-b border-border last:border-0"><td className={cell}><p className="font-medium">{row.name}</p><p className="text-xs text-muted-foreground">{row.slug}</p></td><td className={numeric}>{row.units.toLocaleString('en-PH')}</td><td className={numeric}>{formatPrice(row.revenue)}</td></tr>)}
    {rows.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No non-cancelled product sales in this range.</td></tr>}
  </tbody></table></div>;
}

export default async function ReportsPage(props: PageProps<'/admin/reports'>) {
  await requireAdmin();
  const params = await props.searchParams;
  const defaults = defaultSalesDates();
  const start = typeof params.start === 'string' ? params.start : defaults.startDate;
  const end = typeof params.end === 'string' ? params.end : defaults.endDate;
  const period = params.period === 'week' || params.period === 'month' ? params.period : 'day';
  const parsed = parseSalesRange(params);
  const heading = <>
    <div><h1 className="text-2xl font-bold">Reports</h1><p className="mt-1 text-sm text-muted-foreground">Dates use Asia/Manila and the order’s creation date. All revenue excludes cancelled orders.</p></div>
    <ReportFilters key={`${start}:${end}:${period}`} start={start} end={end} period={period} />
  </>;
  if (!parsed.range) return <div className="flex flex-col gap-6">{heading}<p role="alert" className="rounded-xl border border-border p-5 text-sm text-red-600">{parsed.error}</p></div>;
  const range = parsed.range;
  const data = await getReports(range);
  const download = (kind: string) => {
    const query = salesRangeParams(range);
    query.set('report', kind);
    return <a download href={`/admin/reports/export?${query.toString()}`} className={buttonClassName({ variant: 'secondary', size: 'sm' })}>Export CSV</a>;
  };
  return <div className="flex flex-col gap-6">
    {heading}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <DashboardStatCard label="Revenue (excl. cancelled)" value={formatPrice(data.revenue)} note="Selected range · Includes shipping" />
      <DashboardStatCard label="Paid revenue" value={formatPrice(data.paidRevenue)} note="Selected range · Excludes cancelled · Includes shipping" />
      <DashboardStatCard label="Orders" value={data.totalOrders.toLocaleString('en-PH')} note="Selected range · All statuses" />
    </div>
    {data.totalOrders === 0 && <p className="rounded-xl border border-border p-5 text-sm text-muted-foreground">No orders in this date range. Try another range.</p>}
    <section className="rounded-xl border border-border bg-background p-5" aria-labelledby="period-revenue-title">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="period-revenue-title" className="text-sm font-semibold uppercase tracking-wide">Revenue by period</h2>{download('revenue')}</div>
      <p className="mb-4 mt-2 text-xs text-muted-foreground">Order revenue includes shipping and unpaid orders. Paid revenue is a subset. Orders include cancelled orders. Weeks start Monday; boundary periods include only selected dates.</p>
      <RevenueBarChart data={data.periods.map((row) => ({ label: reportPeriodLabel(row.period, range.period), axisLabel: range.period === 'month' ? row.period.slice(0, 7) : row.period.slice(5), revenue: row.revenue, orders: row.orders }))} />
      <div className="mt-5 max-h-96 overflow-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border text-muted-foreground"><th scope="col" className={cell}>Period</th><th scope="col" className={numeric}>Orders</th><th scope="col" className={numeric}>Revenue</th><th scope="col" className={numeric}>Paid revenue</th></tr></thead><tbody>
        {data.periods.map((row) => <tr key={row.period} className="border-b border-border last:border-0"><td className={`${cell} whitespace-nowrap`}>{reportPeriodLabel(row.period, range.period)}</td><td className={numeric}>{row.orders.toLocaleString('en-PH')}</td><td className={numeric}>{formatPrice(row.revenue)}</td><td className={numeric}>{formatPrice(row.paidRevenue)}</td></tr>)}
      </tbody><tfoot><tr className="border-t border-border font-semibold"><th scope="row" className={cell}>Range total</th><td className={numeric}>{data.totalOrders.toLocaleString('en-PH')}</td><td className={numeric}>{formatPrice(data.revenue)}</td><td className={numeric}>{formatPrice(data.paidRevenue)}</td></tr></tfoot></table></div>
    </section>
    <section className="rounded-xl border border-border bg-background p-5" aria-labelledby="top-products-title">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="top-products-title" className="text-sm font-semibold uppercase tracking-wide">Top products</h2>{download('top-products')}</div>
      <p className="mt-2 text-xs text-muted-foreground">Stored order-item prices × quantities, excluding cancelled orders and shipping. Names come from order snapshots. CSV includes both rankings.</p>
      <div className="mt-5 grid gap-6 xl:grid-cols-2"><div><h3 className="mb-2 text-sm font-semibold">Top 10 by units sold</h3><ProductTable rows={data.topByUnits} /></div><div><h3 className="mb-2 text-sm font-semibold">Top 10 by revenue</h3><ProductTable rows={data.topByRevenue} /></div></div>
    </section>
    <section className="rounded-xl border border-border bg-background p-5" aria-labelledby="category-sales-title">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="category-sales-title" className="text-sm font-semibold uppercase tracking-wide">Sales by category</h2>{download('categories')}</div>
      <p className="mt-2 text-xs text-muted-foreground">Sales are grouped by each product’s current category. Deleted/unmatched products appear as “Unknown/deleted product”. Item revenue excludes shipping and cancelled orders; share is a percentage of total item revenue.</p>
      <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border text-muted-foreground"><th scope="col" className={cell}>Category</th><th scope="col" className={numeric}>Units</th><th scope="col" className={numeric}>Item revenue</th><th scope="col" className={numeric}>Share</th></tr></thead><tbody>
        {data.categories.map((row) => <tr key={row.slug ?? 'unknown-category'} className="border-b border-border last:border-0"><td className={cell}>{row.name}</td><td className={numeric}>{row.units.toLocaleString('en-PH')}</td><td className={numeric}>{formatPrice(row.revenue)}</td><td className={numeric}>{row.share.toFixed(1)}%</td></tr>)}
        {data.categories.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No non-cancelled category sales in this range.</td></tr>}
      </tbody><tfoot><tr className="border-t border-border font-semibold"><th scope="row" className={cell}>Total item sales</th><td className={numeric}>{data.units.toLocaleString('en-PH')}</td><td className={numeric}>{formatPrice(data.itemRevenue)}</td><td className={numeric}>{data.itemRevenue ? '100%' : '0%'}</td></tr></tfoot></table></div>
    </section>
  </div>;
}

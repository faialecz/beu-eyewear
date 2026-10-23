import { requireAdmin } from '@/lib/auth/session';
import { parseSalesRange, manilaDate } from '@/lib/admin/dates';
import { createCsv } from '@/lib/admin/csv';
import { getCategorySales, getRevenuePeriods, getTopProducts, reportPeriodLabel } from '@/lib/admin/reports';
import { formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  await requireAdmin();
  const params = new URL(request.url).searchParams;
  const read = (key: string) => {
    const values = params.getAll(key);
    return values.length > 1 ? values : values[0];
  };
  const parsed = parseSalesRange({ start: read('start'), end: read('end'), period: read('period') });
  if (!parsed.range) return new Response(parsed.error, { status: 400, headers: { 'Cache-Control': 'private, no-store' } });
  const kind = read('report');
  if (kind !== 'revenue' && kind !== 'top-products' && kind !== 'categories') return new Response('Choose a valid report export.', { status: 400, headers: { 'Cache-Control': 'private, no-store' } });
  const range = parsed.range;
  let rows: (string | number | null)[][];
  try {
    if (kind === 'revenue') {
      const periods = await getRevenuePeriods(range);
      rows = [['Period (Asia/Manila)', 'Orders (all statuses)', 'Revenue (excl. cancelled; incl. shipping)', 'Paid revenue (excl. cancelled; incl. shipping)'],
        ...periods.map((row) => [reportPeriodLabel(row.period, range.period), row.orders, formatPrice(row.revenue), formatPrice(row.paidRevenue)])];
    } else if (kind === 'top-products') {
      const [units, revenue] = await Promise.all([getTopProducts(range, 'units'), getTopProducts(range, 'revenue')]);
      rows = [['Ranking', 'Rank', 'Product slug', 'Product name (order snapshot)', 'Units (excl. cancelled)', 'Item revenue (excl. cancelled; no shipping)'],
        ...units.map((row, index) => ['By units', index + 1, row.slug, row.name, row.units, formatPrice(row.revenue)]),
        ...revenue.map((row, index) => ['By revenue', index + 1, row.slug, row.name, row.units, formatPrice(row.revenue)])];
    } else {
      const categories = await getCategorySales(range);
      rows = [['Current category slug', 'Current category (deleted/unmatched: Unknown/deleted product)', 'Units (excl. cancelled)', 'Item revenue (excl. cancelled; no shipping)', 'Share of item revenue'],
        ...categories.map((row) => [row.slug, row.name, row.units, formatPrice(row.revenue), `${row.share.toFixed(2)}%`])];
    }
  } catch {
    return new Response('We couldn’t export this report. Please try again.', { status: 500, headers: { 'Cache-Control': 'private, no-store' } });
  }
  return new Response(createCsv(rows), { headers: {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="beu-${kind}-${manilaDate()}.csv"`,
    'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
  } });
}

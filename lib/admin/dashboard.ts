import 'server-only';

import { prisma } from '@/lib/prisma';
import { LOW_STOCK_THRESHOLD } from './config';
import { parseSalesRange, periodDates, type SalesRange } from './dates';

export interface DailySales {
  date: string;
  revenue: number;
  orders: number;
}

export async function getDailyTrend(range: SalesRange): Promise<DailySales[]> {
  const rows = await prisma.$queryRaw<{ date: string; revenue: bigint; orders: bigint }[]>`
    SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD') AS date,
      COALESCE(SUM(total) FILTER (WHERE status <> 'CANCELLED'), 0)::bigint AS revenue,
      COUNT(*)::bigint AS orders
    FROM "Order"
    WHERE "createdAt" >= (${range.start.toISOString()}::timestamptz AT TIME ZONE 'UTC')
      AND "createdAt" < (${range.endExclusive.toISOString()}::timestamptz AT TIME ZONE 'UTC')
    GROUP BY 1 ORDER BY 1
  `;
  const byDate = new Map(rows.map((row) => [row.date, row]));
  return periodDates({ ...range, period: 'day' }).map((date) => ({
    date, revenue: Number(byDate.get(date)?.revenue ?? 0), orders: Number(byDate.get(date)?.orders ?? 0),
  }));
}

export async function getDashboard(now = new Date()) {
  const parsed = parseSalesRange({}, now);
  if (!parsed.range) throw new Error('Could not determine dashboard dates.');
  const range = parsed.range;
  const [revenue, paidRevenue, statuses, lowStock, outOfStock, trend, recentOrders] = await Promise.all([
    prisma.order.aggregate({ where: { status: { not: 'CANCELLED' } }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { status: { not: 'CANCELLED' }, paymentStatus: 'PAID' }, _sum: { total: true } }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.product.count({ where: { stockQuantity: { gte: 1, lte: LOW_STOCK_THRESHOLD } } }),
    prisma.product.count({ where: { stockQuantity: 0 } }),
    getDailyTrend(range),
    prisma.order.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 5,
      select: { id: true, number: true, total: true, status: true, user: { select: { name: true } } } }),
  ]);
  return {
    revenue: revenue._sum.total ?? 0, paidRevenue: paidRevenue._sum.total ?? 0,
    totalOrders: statuses.reduce((sum, row) => sum + row._count._all, 0),
    waitingOrders: statuses.filter((row) => row.status === 'PENDING' || row.status === 'PROCESSING').reduce((sum, row) => sum + row._count._all, 0),
    statuses, lowStock, outOfStock, trend, recentOrders,
    startDate: range.startDate, endDate: range.endDate,
  };
}

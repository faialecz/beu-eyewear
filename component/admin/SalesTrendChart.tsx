'use client';

import { useId, useState } from 'react';
import type { DailySales } from '@/lib/admin/dashboard';
import { displaySalesDate } from '@/lib/admin/dates';
import { formatPrice } from '@/lib/format';

export default function SalesTrendChart({ data }: { data: DailySales[] }) {
  const id = useId();
  const [active, setActive] = useState(data.length - 1);
  if (data.length === 0) return <p className="text-sm text-muted-foreground">No trend data available.</p>;
  const selected = data[Math.min(Math.max(active, 0), data.length - 1)];
  const width = 900, height = 300, left = 110, right = 65, top = 35, bottom = 55;
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const maxRevenue = Math.max(1, ...data.map((row) => row.revenue));
  const maxOrders = Math.max(4, Math.ceil(Math.max(...data.map((row) => row.orders)) / 4) * 4);
  const x = (index: number) => left + index * plotWidth / Math.max(1, data.length - 1);
  const y = (value: number, max: number) => top + plotHeight * (1 - value / max);
  const points = (field: 'revenue' | 'orders', max: number) => data.map((row, index) => `${x(index)},${y(row[field], max)}`).join(' ');
  return (
    <div>
      <div className="flex flex-wrap gap-5 text-xs font-semibold">
        <span className="text-brand-700 dark:text-foreground">━ Revenue (excl. cancelled)</span>
        <span className="text-muted-foreground">┄ Orders (all statuses)</span>
      </div>
      <div className="mt-3 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-160 w-full" role="group" aria-labelledby={`${id}-title`}>
          <title id={`${id}-title`}>Daily revenue and orders, last 30 Manila calendar days. Focus a day for details.</title>
          <text x={left} y={15} className="fill-foreground text-xs">Revenue (₱)</text>
          <text x={width - right} y={15} textAnchor="end" className="fill-foreground text-xs">Orders</text>
          {[0, 1, 2, 3, 4].map((tick) => {
            const level = tick / 4;
            const axisY = top + plotHeight * (1 - level);
            return <g key={tick}>
              <line x1={left} x2={width - right} y1={axisY} y2={axisY} className="stroke-border" />
              <text x={left - 12} y={axisY + 4} textAnchor="end" className="fill-muted-foreground text-xs">{formatPrice(Math.round(maxRevenue * level))}</text>
              <text x={width - right + 12} y={axisY + 4} className="fill-muted-foreground text-xs">{maxOrders * level}</text>
            </g>;
          })}
          <polyline points={points('revenue', maxRevenue)} fill="none" stroke="currentColor" strokeWidth={2.5} className="text-brand-700 dark:text-foreground" />
          <polyline points={points('orders', maxOrders)} fill="none" stroke="currentColor" strokeWidth={2} strokeDasharray="6 4" className="text-muted-foreground" />
          {data.map((row, index) => <g key={row.date}>
            {(index % 7 === 0 || index === data.length - 1) && <text x={x(index)} y={height - 25} textAnchor="middle" className="fill-muted-foreground text-xs">{row.date.slice(5)}</text>}
            <rect x={x(index) - plotWidth / data.length / 2} y={top} width={plotWidth / data.length} height={plotHeight} fill="transparent" tabIndex={0} role="button"
              aria-label={`${displaySalesDate(row.date)}: ${formatPrice(row.revenue)}, ${row.orders} orders`}
              onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => setActive(index)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setActive(index); } }}
              className="cursor-crosshair focus:outline focus:outline-1 focus:outline-foreground" />
          </g>)}
          <line x1={x(Math.min(Math.max(active, 0), data.length - 1))} x2={x(Math.min(Math.max(active, 0), data.length - 1))} y1={top} y2={top + plotHeight} className="pointer-events-none stroke-muted-foreground" strokeDasharray="3 3" />
          <text x={left + plotWidth / 2} y={height - 3} textAnchor="middle" className="fill-muted-foreground text-xs">Date (Asia/Manila)</text>
        </svg>
      </div>
      <p role="status" aria-live="polite" className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm tabular-nums"><strong>{displaySalesDate(selected.date)}</strong> · Revenue {formatPrice(selected.revenue)} · {selected.orders} orders</p>
      {data.every((row) => row.orders === 0) && <p className="mt-3 text-sm text-muted-foreground">No orders in the last 30 days.</p>}
    </div>
  );
}

'use client';

import { useId, useState } from 'react';
import { formatPrice } from '@/lib/format';

export default function RevenueBarChart({ data }: { data: { label: string; axisLabel: string; revenue: number; orders: number }[] }) {
  const id = useId();
  const [active, setActive] = useState(0);
  if (data.length === 0) return null;
  const width = Math.max(700, 120 + data.length * 18), height = 260, left = 110, top = 30, bottom = 50;
  const plotHeight = height - top - bottom, plotWidth = width - left - 20;
  const slot = plotWidth / data.length, max = Math.max(1, ...data.map((row) => row.revenue));
  const selected = data[Math.min(active, data.length - 1)];
  return <div>
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width, minWidth: '100%' }} className="h-auto" role="group" aria-labelledby={`${id}-title`}>
        <title id={`${id}-title`}>Revenue by selected period. Hover or focus a bar for details.</title>
        <text x={left} y={15} className="fill-foreground text-xs">Revenue (₱), excl. cancelled</text>
        {[0, 0.5, 1].map((level) => <g key={level}><line x1={left} x2={width - 20} y1={top + plotHeight * (1 - level)} y2={top + plotHeight * (1 - level)} className="stroke-border" /><text x={left - 10} y={top + plotHeight * (1 - level) + 4} textAnchor="end" className="fill-muted-foreground text-xs">{formatPrice(Math.round(max * level))}</text></g>)}
        {data.map((row, index) => <g key={row.label}>
          <rect x={left + index * slot + slot * 0.15} y={top + plotHeight * (1 - row.revenue / max)} width={slot * 0.7} height={plotHeight * row.revenue / max} rx={2} className="fill-brand-700 dark:fill-foreground" />
          <rect x={left + index * slot} y={top} width={slot} height={plotHeight} fill="transparent" tabIndex={0} role="button" aria-label={`${row.label}: ${formatPrice(row.revenue)}, ${row.orders} orders`}
            onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => setActive(index)}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setActive(index); } }}
            className="cursor-crosshair focus:outline focus:outline-1 focus:outline-foreground"><title>{row.label}: {formatPrice(row.revenue)} · {row.orders} orders</title></rect>
          {(index % Math.ceil(data.length / 6) === 0 || index === data.length - 1) && <text x={left + index * slot + slot / 2} y={height - 28} textAnchor="middle" className="fill-muted-foreground text-xs">{row.axisLabel}</text>}
        </g>)}
        <text x={left + plotWidth / 2} y={height - 4} textAnchor="middle" className="fill-muted-foreground text-xs">Period (Asia/Manila)</text>
      </svg>
    </div>
    <p role="status" aria-live="polite" className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm tabular-nums"><strong>{selected.label}</strong> · {formatPrice(selected.revenue)} · {selected.orders} orders</p>
  </div>;
}

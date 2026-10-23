'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { buttonClassName } from '@/component/Button';

export default function ReportFilters({ start, end, period }: { start: string; end: string; period: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const fieldClassName = 'mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm';
  return (
    <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const params = new URLSearchParams({ start: String(data.get('start') ?? ''), end: String(data.get('end') ?? ''), period: String(data.get('period') ?? 'day') });
      startTransition(() => router.push(`/admin/reports?${params.toString()}`, { scroll: false }));
    }}>
      <label className="flex flex-col text-xs font-semibold uppercase tracking-wide">Start date<input type="date" name="start" required defaultValue={start} className={fieldClassName} /></label>
      <label className="flex flex-col text-xs font-semibold uppercase tracking-wide">End date<input type="date" name="end" required defaultValue={end} className={fieldClassName} /></label>
      <label className="flex flex-col text-xs font-semibold uppercase tracking-wide">Period<select name="period" defaultValue={period} className={fieldClassName}><option value="day">Day</option><option value="week">Week</option><option value="month">Month</option></select></label>
      <button type="submit" disabled={pending} className={buttonClassName({ variant: 'primary' })}>{pending ? 'Loading…' : 'Apply filters'}</button>
      <Link href="/admin/reports" scroll={false} className={buttonClassName({ variant: 'secondary' })}>Last 30 days</Link>
    </form>
  );
}

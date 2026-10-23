'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buttonClassName } from '@/component/Button';
import type { InventoryFilter } from '@/lib/admin/inventory';

const fieldClassName = 'rounded-lg border border-border bg-background px-3 py-2 text-sm';

export default function InventoryFilters({ q, filter }: { q: string; filter: InventoryFilter }) {
  const router = useRouter();
  return (
    <form className="flex flex-wrap items-center gap-3" onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const params = new URLSearchParams();
      const query = String(data.get('q') ?? '').trim();
      const status = String(data.get('filter') ?? 'all');
      if (query) params.set('q', query);
      if (status === 'low' || status === 'out') params.set('filter', status);
      const search = params.toString();
      router.push(`/admin/inventory${search ? `?${search}` : ''}`, { scroll: false });
    }}>
      <input type="search" name="q" maxLength={120} defaultValue={q} placeholder="Search by product name" aria-label="Search inventory by product name" className={`${fieldClassName} w-full sm:w-64`} />
      <select name="filter" defaultValue={filter} aria-label="Filter by stock status" className={fieldClassName}>
        <option value="all">All</option>
        <option value="low">Low stock</option>
        <option value="out">Out of stock</option>
      </select>
      <button type="submit" className={buttonClassName({ variant: 'secondary' })}>Filter</button>
      {(q || filter !== 'all') && <Link href="/admin/inventory" scroll={false} className="text-sm text-muted-foreground underline hover:text-foreground">Clear</Link>}
    </form>
  );
}

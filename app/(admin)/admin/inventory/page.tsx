import Link from 'next/link';
import { buttonClassName } from '@/component/Button';
import InventoryStockBadge from '@/component/admin/InventoryStockBadge';
import StockAdjustForm from '@/component/admin/StockAdjustForm';
import { requireAdmin } from '@/lib/auth/session';
import { LOW_STOCK_THRESHOLD } from '@/lib/admin/config';
import { getInventory, parseInventoryFilters } from '@/lib/admin/inventory';
import { adjustStock } from './actions';

export const dynamic = 'force-dynamic';

const fieldClassName = 'rounded-lg border border-border bg-background px-3 py-2 text-sm';

export default async function InventoryPage(props: PageProps<'/admin/inventory'>) {
  await requireAdmin();
  const { q, filter } = parseInventoryFilters(await props.searchParams);
  const products = await getInventory({ q, filter });
  const filtered = Boolean(q || filter !== 'all');
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage product stock. Low stock means 1–{LOW_STOCK_THRESHOLD} units.</p>
      </div>
      <form className="flex flex-wrap items-center gap-3">
        <input type="search" name="q" maxLength={120} defaultValue={q} placeholder="Search by product name" aria-label="Search inventory by product name" className={`${fieldClassName} w-full sm:w-64`} />
        <select name="filter" defaultValue={filter} aria-label="Filter by stock status" className={fieldClassName}>
          <option value="all">All</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        <button type="submit" className={buttonClassName({ variant: 'secondary' })}>Filter</button>
        {filtered && <Link href="/admin/inventory" className="text-sm text-muted-foreground underline hover:text-foreground">Clear</Link>}
      </form>
      <div className="overflow-x-auto rounded-xl border border-border bg-background">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-border text-muted-foreground">
            <th scope="col" className="px-4 py-3 font-semibold">Name</th>
            <th scope="col" className="px-4 py-3 font-semibold">Category / Subcategory</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Stock</th>
            <th scope="col" className="px-4 py-3 font-semibold">Status</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Quick adjustment</th>
          </tr></thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.slug} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3 font-medium">{product.name}</td>
                <td className="px-4 py-3 text-muted-foreground"><p>{product.category.name}</p><p className="mt-1 text-xs">{product.subcategory.name}</p></td>
                <td className="px-4 py-3 text-right tabular-nums">{product.stockQuantity.toLocaleString('en-PH')}</td>
                <td className="whitespace-nowrap px-4 py-3"><InventoryStockBadge quantity={product.stockQuantity} /></td>
                <td className="px-4 py-3"><StockAdjustForm action={adjustStock.bind(null, product.slug)} quantity={product.stockQuantity} name={product.name} /></td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{filtered ? 'No products match your filters.' : 'No products yet.'}</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{products.length} product{products.length === 1 ? '' : 's'}{filtered ? ' matching your filters' : ''}.</p>
    </div>
  );
}

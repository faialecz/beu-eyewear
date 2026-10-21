import Link from 'next/link';
import { buttonClassName } from '@/component/Button';
import Pagination from '@/component/admin/Pagination';
import { getCustomers } from '@/lib/customers/queries';
import { formatPrice } from '@/lib/format';

// Admin data must always be fresh — never a static build-time snapshot.
export const dynamic = 'force-dynamic';

const filterClassName = 'rounded-lg border border-border bg-background px-3 py-2 text-sm';

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' });
}

export default async function AdminCustomersPage(props: PageProps<'/admin/customers'>) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === 'string' ? searchParams.q.trim() : '';
  const requestedPage = Number(typeof searchParams.page === 'string' ? searchParams.page : 1);

  const { customers, filteredCount, totalCount, page, totalPages } = await getCustomers({
    q,
    page: Number.isInteger(requestedPage) ? requestedPage : 1,
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Customers</h1>

      <form className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or email"
          aria-label="Search customers"
          className={`${filterClassName} w-72`}
        />
        <button type="submit" className={buttonClassName({ variant: 'secondary' })}>
          Search
        </button>
        {q && (
          <Link href="/admin/customers" className="text-sm text-muted-foreground underline hover:text-foreground">
            Clear
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold">Orders</th>
              <th className="px-4 py-3 font-semibold">Total spent</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/admin/customers/${customer.id}`} className="hover:underline">
                    {customer.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="text-muted-foreground">{customer.email}</span>
                  {!customer.emailVerifiedAt && (
                    <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600">
                      Unverified
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(customer.createdAt)}</td>
                <td className="px-4 py-3">{customer._count.orders}</td>
                <td className="px-4 py-3">{formatPrice(customer.totalSpent)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/customers/${customer.id}`} className="underline hover:text-foreground">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  {q ? 'No customers match your search.' : 'No customers yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {q ? `${filteredCount} of ${totalCount} customers.` : `${totalCount} customers.`}
        </p>
        <Pagination basePath="/admin/customers" params={q ? { q } : {}} page={page} totalPages={totalPages} />
      </div>
    </div>
  );
}

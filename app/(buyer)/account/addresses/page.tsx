import Link from 'next/link';
import { Plus } from 'lucide-react';
import { buttonClassName } from '@/component/Button';
import { requireUser } from '@/lib/auth/session';
import { MAX_SAVED_ADDRESSES } from '@/lib/checkout/address';
import { getSavedAddresses } from '@/lib/checkout/saved-address';
import { deleteAddress, setDefaultAddress } from './actions';

export default async function AddressesPage() {
  // Checked here rather than in account/layout.tsx so /account/wishlist
  // (localStorage-backed) stays usable without signing in.
  const user = await requireUser('/account/addresses');
  const addresses = await getSavedAddresses(user.id);
  const atLimit = addresses.length >= MAX_SAVED_ADDRESSES;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Address Book</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your saved shipping addresses. The default is preselected at checkout.
          </p>
        </div>
        {!atLimit && (
          <Link href="/account/addresses/new" className={buttonClassName({ variant: 'primary' })}>
            <Plus size={16} aria-hidden="true" />
            Add Address
          </Link>
        )}
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-2xl border border-border p-6">
          <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
          <Link href="/account/addresses/new" className={buttonClassName({ variant: 'primary', className: 'mt-4' })}>
            Add your first address
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="flex flex-col gap-4 rounded-2xl border border-border p-6 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  {address.label && <span className="text-base font-bold">{address.label}</span>}
                  {address.isDefault && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">Default</span>
                  )}
                </div>
                <p className={address.label ? 'mt-1' : 'text-base font-bold'}>{address.fullName}</p>
                <p className="mt-1 wrap-break-word text-muted-foreground">{address.address}</p>
                <p className="text-muted-foreground">
                  {address.city}, {address.province} {address.zip}
                </p>
                <p className="text-muted-foreground">{address.phone}</p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Link
                  href={`/account/addresses/${address.id}/edit`}
                  className={buttonClassName({ variant: 'secondary', size: 'sm' })}
                >
                  Edit
                </Link>
                {!address.isDefault && (
                  <form action={setDefaultAddress}>
                    <input type="hidden" name="id" value={address.id} />
                    <button type="submit" className={buttonClassName({ variant: 'secondary', size: 'sm' })}>
                      Set as default
                    </button>
                  </form>
                )}
                <form action={deleteAddress}>
                  <input type="hidden" name="id" value={address.id} />
                  <button type="submit" className={buttonClassName({ variant: 'secondary', size: 'sm' })}>
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {atLimit && (
        <p className="text-xs text-muted-foreground">
          You&apos;ve reached the limit of {MAX_SAVED_ADDRESSES} saved addresses. Delete one to add another.
        </p>
      )}
    </div>
  );
}

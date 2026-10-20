import { redirect } from 'next/navigation';
import AddressForm from '@/component/account/AddressForm';
import { requireUser } from '@/lib/auth/session';
import { MAX_SAVED_ADDRESSES } from '@/lib/checkout/address';
import { getSavedAddresses } from '@/lib/checkout/saved-address';

export default async function NewAddressPage() {
  const user = await requireUser('/account/addresses/new');
  const addresses = await getSavedAddresses(user.id);
  if (addresses.length >= MAX_SAVED_ADDRESSES) redirect('/account/addresses');

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Add Address</h1>
      <AddressForm defaultName={user.name} isFirst={addresses.length === 0} />
    </div>
  );
}

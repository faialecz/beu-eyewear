import { notFound } from 'next/navigation';
import AddressForm from '@/component/account/AddressForm';
import { requireUser } from '@/lib/auth/session';
import { getSavedAddress } from '@/lib/checkout/saved-address';

export default async function EditAddressPage(props: PageProps<'/account/addresses/[id]/edit'>) {
  const { id } = await props.params;
  const user = await requireUser(`/account/addresses/${id}/edit`);

  const address = await getSavedAddress(user.id, id);
  if (!address) notFound();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Edit Address</h1>
      <AddressForm address={address} />
    </div>
  );
}

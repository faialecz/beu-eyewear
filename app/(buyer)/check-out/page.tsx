import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import Breadcrumb from '@/component/Breadcrumb';
import CheckoutForm from '@/component/CheckoutForm';
import Reveal from '@/component/Reveal';
import { requireUser } from '@/lib/auth/session';
import { getSavedAddresses } from '@/lib/checkout/saved-address';

export default async function Page(props: PageProps<'/check-out'>) {
  const { line } = await props.searchParams;

  // The cart page sends the lines the buyer ticked as repeated ?line=slug::color
  // params. No params means the whole cart.
  const selectedKeys = line === undefined ? undefined : Array.isArray(line) ? line : [line];

  // Keep the selection through a sign-in round trip.
  const here = selectedKeys
    ? `/check-out?${new URLSearchParams(selectedKeys.map((key) => ['line', key])).toString()}`
    : '/check-out';
  const user = await requireUser(here);
  const savedAddresses = await getSavedAddresses(user.id);

  return (
    <>
      <Reveal mode="mount" className="px-6 pt-6">
        <div className="hidden md:block">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/home' },
              { label: 'Listing', href: '/listing' },
              { label: 'Cart', href: '/cart' },
              { label: 'Checkout' },
            ]}
          />
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/cart" aria-label="Back to cart">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold uppercase">Checkout</h1>
        </div>
      </Reveal>

      <Reveal mode="mount" className="px-6 py-8">
        <CheckoutForm defaultName={user.name} savedAddresses={savedAddresses} selectedKeys={selectedKeys} />
      </Reveal>
    </>
  );
}

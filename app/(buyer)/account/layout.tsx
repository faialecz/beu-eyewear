import Link from 'next/link';
import type { ReactNode } from 'react';

const ACCOUNT_LINKS = [
  { href: '/account', label: 'Overview' },
  { href: '/account/profile', label: 'Profile' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/wishlist', label: 'Wishlist' },
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-8 px-6 py-10 md:flex-row">
      <aside className="w-full shrink-0 md:w-56">
        <nav aria-label="Account navigation" className="flex flex-col gap-3">
          {ACCOUNT_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}
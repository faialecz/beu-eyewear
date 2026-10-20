import Link from 'next/link';
import { Heart, MailWarning, MapPin, Package, UserRound } from 'lucide-react';
import { buttonClassName } from '@/component/Button';
import { logout } from '@/lib/auth/actions';
import { requireUser } from '@/lib/auth/session';

const QUICK_LINKS = [
  { href: '/account/profile', label: 'Profile', description: 'Edit details and change your password', icon: UserRound },
  { href: '/account/orders', label: 'Orders', description: 'Track and review past purchases', icon: Package },
  { href: '/account/addresses', label: 'Addresses', description: 'Manage your shipping addresses', icon: MapPin },
  { href: '/account/wishlist', label: 'Wishlist', description: 'Products you have saved', icon: Heart },
] as const;

export default async function AccountPage() {
  // Checked here rather than in account/layout.tsx so /account/wishlist
  // (localStorage-backed) stays usable without signing in.
  const user = await requireUser('/account');

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Account Overview</h1>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border p-6">
        <div>
          <p className="text-lg font-bold">{user.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <form action={logout}>
          <button type="submit" className={buttonClassName({ variant: 'secondary' })}>
            Sign Out
          </button>
        </form>
      </div>

      {!user.emailVerifiedAt && (
        <Link
          href="/account/profile"
          className="flex items-center gap-3 rounded-2xl border border-amber-400/60 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <MailWarning size={18} aria-hidden="true" className="shrink-0" />
          <span>Your email isn&apos;t verified yet. Verify it so you can recover your account.</span>
        </Link>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col gap-2 rounded-2xl border border-border p-5 transition duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md"
          >
            <Icon size={20} />
            <p className="font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

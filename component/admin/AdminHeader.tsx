'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, LogOut, Menu } from 'lucide-react';
import ThemeToggle from '@/component/ThemeToggle';
import { logout } from '@/lib/auth/actions';

const ADMIN_ROLE_LABEL = 'Store Administrator';

function prettifySegment(segment: string): string {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const rest = segments.slice(1); // drop the leading "admin" segment

  const crumbs = [{ label: 'Dashboard', href: '/admin' }];
  let href = '/admin';
  for (const segment of rest) {
    href += `/${segment}`;
    // Order and customer ids are cuids; "Orders › ckx9f2…" isn't a useful crumb.
    crumbs.push({ label: /^c[a-z0-9]{20,}$/.test(segment) ? 'Details' : prettifySegment(segment), href });
  }
  return crumbs;
}

export interface AdminHeaderProps {
  adminName: string;
  onMobileMenuToggle: () => void;
}

export default function AdminHeader({ adminName, onMobileMenuToggle }: AdminHeaderProps) {
  const pathname = usePathname() ?? '/admin';
  const breadcrumbs = buildBreadcrumbs(pathname);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [profileOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          aria-label="Toggle menu"
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden"
        >
          <Menu size={20} />
        </button>

        <nav aria-label="Breadcrumb" className="hidden sm:block">
          <ol className="flex items-center text-sm font-medium">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li key={crumb.href} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight size={16} className="mx-2 shrink-0 text-muted-foreground" aria-hidden="true" />
                  )}
                  {isLast ? (
                    <span className="font-semibold text-foreground" aria-current="page">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link href={crumb.href} className="text-muted-foreground hover:text-foreground">
                      {crumb.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <ThemeToggle />
        <span aria-hidden="true" className="hidden h-6 w-px bg-border sm:block" />

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            aria-expanded={profileOpen}
            aria-haspopup="true"
            className="flex items-center gap-3 rounded-full p-1 hover:bg-muted"
          >
            <div className="hidden text-right sm:block">
              <span className="block text-sm font-semibold leading-tight text-foreground">{adminName}</span>
              <span className="block text-xs text-muted-foreground">{ADMIN_ROLE_LABEL}</span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">
              {adminName.charAt(0).toUpperCase()}
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-border bg-background p-2 shadow-lg">
              <div className="border-b border-border px-3 py-2 sm:hidden">
                <p className="text-sm font-semibold text-foreground">{adminName}</p>
                <p className="text-xs text-muted-foreground">{ADMIN_ROLE_LABEL}</p>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-muted"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

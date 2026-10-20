import Image from "next/image";
import Link from "next/link";
import { Menu, User, Heart, ShoppingBag, LayoutDashboard } from "lucide-react";
import CartBadge from "@/component/CartBadge";
import HeaderSearch from "@/component/HeaderSearch";
import LoginModalTrigger from "@/component/LoginModalTrigger";
import ThemeToggle from "@/component/ThemeToggle";
import WishlistBadge from "@/component/WishlistBadge";
import { getCurrentUser } from "@/lib/auth/session";

export default async function Header() {
  // Signed in: user icon goes to /account. Signed out: opens the login modal.
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center border-b border-border bg-background px-6 py-3 shadow-sm">
      <div className="flex items-center">
        {/* Mobile nav drawer not wired up yet (lowfi pass) */}
        <button aria-label="Menu" type="button" className="md:hidden">
          <Menu size={22} strokeWidth={1.5} />
        </button>
        <nav className="hidden items-center gap-7 md:flex">
          <Link href="/listing" className="text-[15px] hover:underline hover:underline-offset-4">
            Shop
          </Link>
          <Link href="/search" className="text-[15px] hover:underline hover:underline-offset-4">
            Explore
          </Link>
        </nav>
      </div>

      <Link href="/home" aria-label="BeU home">
        <Image
          src="/Logo-Dark-Mark.png"
          alt="BeU"
          width={380}
          height={380}
          priority
          className="h-12 w-12 dark:hidden"
        />
        <Image
          src="/Logo-Light-Mark.png"
          alt="BeU"
          width={380}
          height={380}
          priority
          className="hidden h-12 w-12 dark:block"
        />
      </Link>

      <div className="flex items-center justify-end gap-4">
        <HeaderSearch />
        {user?.role === "ADMIN" && (
          <Link href="/admin" aria-label="Admin">
            <LayoutDashboard size={20} strokeWidth={1.5} />
          </Link>
        )}
        {user ? (
          <Link href="/account" aria-label="Account">
            <User size={20} strokeWidth={1.5} />
          </Link>
        ) : (
          <LoginModalTrigger />
        )}
        <Link href="/account/wishlist" aria-label="Wishlist" className="relative hidden md:block">
          <Heart size={20} strokeWidth={1.5} />
          <WishlistBadge />
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/cart" aria-label="Cart" className="relative">
            <ShoppingBag size={20} strokeWidth={1.5} />
            <CartBadge />
          </Link>
          <span aria-hidden="true" className="hidden h-5 w-px bg-border md:block" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
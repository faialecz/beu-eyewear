"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function MobileMenu({ links }: {
  links: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const dialogId = useId();
  const titleId = useId();

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (desktop.matches) dialogRef.current?.close();
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls={dialogId}
        aria-haspopup="dialog"
        className="inline-flex h-11 w-11 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
        onClick={() => {
          dialogRef.current?.showModal();
          setOpen(true);
        }}
      >
        <Menu size={22} strokeWidth={1.5} />
      </button>
      <dialog
        ref={dialogRef}
        id={dialogId}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-foreground backdrop:bg-black/50"
      >
        <div className="flex h-full w-[min(85vw,20rem)] flex-col overflow-y-auto bg-background p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 id={titleId} className="text-lg font-semibold">Menu</h2>
            <button
              type="button"
              aria-label="Close navigation menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-primary"
              onClick={() => dialogRef.current?.close()}
            >
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>
          <nav aria-label="Mobile navigation" className="mt-4 flex flex-col gap-2">
            {links.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => dialogRef.current?.close()}
                  className={`rounded-md px-3 py-3 text-lg underline-offset-4 hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-primary ${active ? "font-semibold underline" : ""}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </dialog>
    </>
  );
}

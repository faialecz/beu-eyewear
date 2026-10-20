'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import BrandWordmark from '@/component/BrandWordmark';
import { confirmEmail } from '@/lib/auth/account-actions';
import type { FormState } from '@/lib/auth/types';

const initialState: FormState = {};

const primaryClass =
  'flex h-11 w-full items-center justify-center rounded-full bg-[#8499D9] text-sm font-semibold text-white transition-colors hover:bg-[#6F86CF] disabled:cursor-not-allowed disabled:opacity-70';

// The token is only spent when this form is submitted, not when the page loads,
// so email security scanners that prefetch links can't use it up.
export default function ConfirmEmailForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(confirmEmail, initialState);

  return (
    <div className="text-center">
      <BrandWordmark />
      <h1 className="mt-6 text-base font-semibold">{state.success ? 'Email confirmed' : 'Confirm your email'}</h1>

      {state.success ? (
        <>
          <p className="mt-1 text-sm text-muted-foreground">{state.success}</p>
          <Link href="/account/profile" className={`mt-6 ${primaryClass}`}>
            Go to your account
          </Link>
        </>
      ) : (
        <form action={formAction} className="mt-6 flex flex-col">
          <input type="hidden" name="token" value={token} />
          <p className="text-sm text-muted-foreground">Press the button to finish confirming your email address.</p>
          <p aria-live="polite" className="mt-3 min-h-5 text-xs text-red-500">
            {state.error}
          </p>
          <button type="submit" disabled={pending} className={`mt-2 ${primaryClass}`}>
            {pending ? 'Confirming...' : 'Confirm email'}
          </button>
        </form>
      )}
    </div>
  );
}

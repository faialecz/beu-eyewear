'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import BrandWordmark from '@/component/BrandWordmark';
import IconField from '@/component/IconField';
import { requestPasswordReset } from '@/lib/auth/account-actions';
import type { FormState } from '@/lib/auth/types';

const initialState: FormState = {};

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <div>
      <div className="text-center">
        <BrandWordmark />
        <h1 className="mt-6 text-base font-semibold">Forgot your password?</h1>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Enter your email and we&apos;ll send you a link to choose a new one.
        </p>
      </div>

      <form action={formAction} className="mt-6 flex flex-col">
        <IconField
          id="email"
          type="email"
          placeholder="Email Address"
          autoComplete="email"
          icon={<Mail size={16} aria-hidden="true" />}
          error={state.fieldErrors?.email}
        />

        <p
          aria-live="polite"
          className={`mt-3 min-h-5 text-center text-xs ${state.error ? 'text-red-500' : 'text-green-600'}`}
        >
          {state.error ?? state.success}
        </p>

        <button
          type="submit"
          disabled={pending}
          className="mt-2 h-11 w-full rounded-full bg-[#8499D9] text-sm font-semibold text-white transition-colors hover:bg-[#6F86CF] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it?{' '}
        <Link href="/login" className="font-semibold text-[#7B8FD6] hover:underline">
          Log In
        </Link>
      </p>
    </div>
  );
}

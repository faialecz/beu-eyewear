'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Lock, Mail } from 'lucide-react';
import BrandWordmark from '@/component/BrandWordmark';
import IconField from '@/component/IconField';
import { login } from '@/lib/auth/actions';
import type { FormState } from '@/lib/auth/types';

const initialState: FormState = {};

const firstError = (errors?: string | string[]) => (Array.isArray(errors) ? errors[0] : errors);

type LoginFormProps = {
  next?: string;
  /** Modal usage: called when leaving via a link (Sign Up) so the modal can close. */
  onNavigate?: () => void;
  /** Modal usage: turns "Continue as Guest" into a button that closes the modal. */
  onGuest?: () => void;
  /** Use h1 when this is the main content of the page (/login). */
  headingAs?: 'h1' | 'h2';
  /** Shown under the heading, e.g. after a password reset. */
  notice?: string;
};

export default function LoginForm({ next, onNavigate, onGuest, headingAs: Heading = 'h2', notice }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div>
      <div className="text-center">
        <BrandWordmark />
        <Heading id="login-title" className="mt-6 text-base font-semibold">
          Welcome Back
        </Heading>
        <p className="mt-1 text-[11px] text-muted-foreground">Please log in to your account.</p>
        {notice && (
          <p role="status" className="mt-3 text-xs text-green-600">
            {notice}
          </p>
        )}
      </div>

      <form action={formAction} className="mt-6 flex flex-col">
        {next && <input type="hidden" name="next" value={next} />}

        <div className="flex flex-col gap-3">
          <IconField
            id="email"
            type="email"
            placeholder="Email Address"
            autoComplete="email"
            icon={<Mail size={16} aria-hidden="true" />}
            error={firstError(state.fieldErrors?.email)}
          />
          <IconField
            id="password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            icon={<Lock size={16} aria-hidden="true" />}
            error={firstError(state.fieldErrors?.password)}
          />
        </div>

        <div className="mt-2 text-right">
          <Link href="/forgot-password" onClick={onNavigate} className="text-[11px] font-medium text-[#7B8FD6] hover:underline">
            Forgot password?
          </Link>
        </div>

        <p aria-live="polite" className="mt-3 min-h-5 text-center text-xs text-red-500">
          {state.error}
        </p>

        <button
          type="submit"
          disabled={pending}
          className="mt-2 h-11 w-full rounded-full bg-[#8499D9] text-sm font-semibold text-white transition-colors hover:bg-[#6F86CF] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? 'Logging in...' : 'Log In'}
        </button>

        {onGuest ? (
          <button
            type="button"
            onClick={onGuest}
            className="mt-3 h-11 w-full rounded-full bg-[#F0EFEA] text-sm font-semibold text-foreground transition-colors hover:bg-[#E6E5DE] dark:bg-muted dark:hover:bg-muted/70"
          >
            Continue as Guest
          </button>
        ) : (
          <Link
            href="/home"
            className="mt-3 flex h-11 w-full items-center justify-center rounded-full bg-[#F0EFEA] text-sm font-semibold text-foreground transition-colors hover:bg-[#E6E5DE] dark:bg-muted dark:hover:bg-muted/70"
          >
            Continue as Guest
          </Link>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}
          onClick={onNavigate}
          className="font-semibold text-[#7B8FD6] hover:underline"
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
}
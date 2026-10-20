'use client';

import { useActionState } from 'react';
import { Lock } from 'lucide-react';
import BrandWordmark from '@/component/BrandWordmark';
import IconField from '@/component/IconField';
import { resetPassword } from '@/lib/auth/account-actions';
import type { FormState } from '@/lib/auth/types';

const initialState: FormState = {};

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  return (
    <div>
      <div className="text-center">
        <BrandWordmark />
        <h1 className="mt-6 text-base font-semibold">Choose a new password</h1>
        <p className="mt-1 text-[11px] text-muted-foreground">You&apos;ll be signed out of all your devices.</p>
      </div>

      <form action={formAction} className="mt-6 flex flex-col">
        <input type="hidden" name="token" value={token} />

        <div className="flex flex-col gap-3">
          <IconField
            id="newPassword"
            type="password"
            placeholder="New Password"
            autoComplete="new-password"
            minLength={8}
            icon={<Lock size={16} aria-hidden="true" />}
            error={state.fieldErrors?.newPassword}
          />
          <IconField
            id="confirmPassword"
            type="password"
            placeholder="Confirm New Password"
            autoComplete="new-password"
            minLength={8}
            icon={<Lock size={16} aria-hidden="true" />}
            error={state.fieldErrors?.confirmPassword}
          />
        </div>

        <p aria-live="polite" className="mt-3 min-h-5 text-center text-xs text-red-500">
          {state.error}
        </p>

        <button
          type="submit"
          disabled={pending}
          className="mt-2 h-11 w-full rounded-full bg-[#8499D9] text-sm font-semibold text-white transition-colors hover:bg-[#6F86CF] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? 'Saving...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}

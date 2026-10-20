'use client';

import { useActionState } from 'react';
import { BadgeCheck, MailWarning } from 'lucide-react';
import { buttonClassName } from '@/component/Button';
import { resendVerification } from '@/lib/auth/account-actions';
import type { FormState } from '@/lib/auth/types';

const initialState: FormState = {};

export default function VerificationCard({ email, verified }: { email: string; verified: boolean }) {
  const [state, formAction, pending] = useActionState(resendVerification, initialState);

  if (verified) {
    return (
      <p className="flex items-center gap-2 text-sm text-green-600">
        <BadgeCheck size={18} aria-hidden="true" />
        {email} is verified.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-sm">
        <MailWarning size={18} aria-hidden="true" className="shrink-0 text-amber-500" />
        <span>
          <span className="break-all">{email}</span> isn&apos;t verified yet.
        </span>
      </p>
      <div aria-live="polite" className="min-h-5 text-sm">
        {state.error && <p className="text-red-500">{state.error}</p>}
        {state.success && <p className="text-green-600">{state.success}</p>}
      </div>
      <div>
        <button type="submit" disabled={pending} className={buttonClassName({ variant: 'secondary' })}>
          {pending ? 'Sending…' : 'Send verification email'}
        </button>
      </div>
    </form>
  );
}

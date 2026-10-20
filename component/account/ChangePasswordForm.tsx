'use client';

import { useActionState } from 'react';
import { buttonClassName } from '@/component/Button';
import TextField from '@/component/FormField';
import { changePassword } from '@/lib/auth/account-actions';
import type { FormState } from '@/lib/auth/types';

const initialState: FormState = {};

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField
        id="currentPassword"
        label="Current password"
        type="password"
        autoComplete="current-password"
        required
        errors={fieldErrors.currentPassword}
      />
      <TextField
        id="newPassword"
        label="New password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        maxLength={128}
        required
        errors={fieldErrors.newPassword}
      />
      <TextField
        id="confirmPassword"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        maxLength={128}
        required
        errors={fieldErrors.confirmPassword}
      />

      <div aria-live="polite" className="min-h-5 text-sm">
        {state.error && <p className="text-red-500">{state.error}</p>}
        {state.success && <p className="text-green-600">{state.success}</p>}
      </div>

      <div>
        <button type="submit" disabled={pending} className={buttonClassName({ variant: 'primary' })}>
          {pending ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </form>
  );
}

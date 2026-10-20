'use client';

import { useActionState, useState } from 'react';
import { buttonClassName } from '@/component/Button';
import TextField from '@/component/FormField';
import { updateProfile } from '@/lib/auth/account-actions';
import type { FormState } from '@/lib/auth/types';

const initialState: FormState = {};

interface ProfileFormProps {
  name: string;
  email: string;
}

export default function ProfileForm({ name, email }: ProfileFormProps) {
  // Drives whether the password field shows. The inputs themselves stay
  // uncontrolled, so React's post-action form reset still works.
  const [emailDraft, setEmailDraft] = useState(email);

  const [state, formAction, pending] = useActionState(async (prevState: FormState, formData: FormData) => {
    const result = await updateProfile(prevState, formData);
    setEmailDraft(result.values?.email ?? email);
    return result;
  }, initialState);

  const fieldErrors = state.fieldErrors ?? {};
  const emailChanged = emailDraft.trim().toLowerCase() !== email.toLowerCase();

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField
        id="name"
        label="Full Name"
        autoComplete="name"
        maxLength={100}
        required
        defaultValue={state.values?.name ?? name}
        errors={fieldErrors.name}
      />
      <TextField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email ?? email}
        onChange={(e) => setEmailDraft(e.target.value)}
        errors={fieldErrors.email}
      />
      {emailChanged && (
        <div className="flex flex-col gap-1.5">
          <TextField
            id="currentPassword"
            label="Current password (needed to change your email)"
            type="password"
            autoComplete="current-password"
            required
            errors={fieldErrors.currentPassword}
          />
          <p className="text-xs text-muted-foreground">
            We&apos;ll email a confirmation link to the new address. Your email only changes once you open it.
          </p>
        </div>
      )}

      <div aria-live="polite" className="min-h-5 text-sm">
        {state.error && <p className="text-red-500">{state.error}</p>}
        {state.success && <p className="text-green-600">{state.success}</p>}
      </div>

      <div>
        <button type="submit" disabled={pending} className={buttonClassName({ variant: 'primary' })}>
          {pending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

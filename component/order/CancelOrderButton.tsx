'use client';

import { useActionState } from 'react';
import { buttonClassName } from '@/component/Button';
import type { FormState } from '@/lib/auth/types';

export interface CancelOrderButtonProps {
  // cancelMyOrder or cancelOrderAsAdmin, already bound to the order id.
  action: () => Promise<FormState>;
  orderLabel: string;
  size?: 'sm' | 'md';
}

export default function CancelOrderButton({ action, orderLabel, size = 'md' }: CancelOrderButtonProps) {
  const [state, formAction, pending] = useActionState(async () => action(), {} as FormState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(`Cancel order ${orderLabel}? This can't be undone.`);
        if (!confirmed) event.preventDefault();
      }}
      className="flex flex-col gap-2"
    >
      <div>
        <button
          type="submit"
          disabled={pending}
          className={buttonClassName({ variant: 'secondary', size, className: 'text-red-600' })}
        >
          {pending ? 'Cancelling…' : 'Cancel order'}
        </button>
      </div>
      <div aria-live="polite" className="text-sm">
        {state.error && <p className="text-red-500">{state.error}</p>}
        {state.success && <p className="text-green-600">{state.success}</p>}
      </div>
    </form>
  );
}

'use client';

import { useActionState, useId } from 'react';
import { buttonClassName } from '@/component/Button';
import type { StockFormState } from '@/lib/admin/inventory';

export default function StockAdjustForm({ action, quantity, name }: {
  action: (previous: StockFormState, data: FormData) => Promise<StockFormState>;
  quantity: number;
  name: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const id = useId();
  const fieldClassName = 'rounded-lg border border-border bg-background px-3 py-2 text-sm';
  return (
    <form action={formAction} className="flex min-w-72 flex-col gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <select name="mode" defaultValue={state.values?.mode ?? 'set'} aria-label={`Adjustment type for ${name}`} className={fieldClassName} disabled={pending}>
          <option value="set">Set stock</option>
          <option value="delta">Adjust by (+/−)</option>
        </select>
        <input name="amount" required inputMode="numeric" pattern="[+\-]?[0-9]+" maxLength={7} defaultValue={state.values?.amount ?? quantity} aria-label={`Stock value or signed adjustment for ${name}`} aria-describedby={`${id}-help`} className={`${fieldClassName} w-28 text-right tabular-nums`} disabled={pending} />
        <button type="submit" disabled={pending} className={buttonClassName({ size: 'sm' })}>{pending ? 'Saving…' : 'Apply'}</button>
      </div>
      <p id={`${id}-help`} className="text-right text-xs text-muted-foreground">Set an exact stock, or adjust by a signed amount (e.g. -2).</p>
      {state.error && <p role="alert" className="text-right text-sm text-red-600">{state.error}</p>}
      {state.message && <p role="status" className="text-right text-xs text-muted-foreground">{state.message}</p>}
    </form>
  );
}

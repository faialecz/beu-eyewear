'use client';

import { useActionState } from 'react';
import { buttonClassName } from '@/component/Button';
import type { CategoryFormState } from '@/lib/admin/categories';

export default function DeleteCategoryButton({ action, name }: {
  action: (previous: CategoryFormState, data: FormData) => Promise<CategoryFormState>;
  name: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} onSubmit={(event) => {
      if (!window.confirm(`Delete “${name}”? This cannot be undone. Products and subcategories must be removed first.`)) event.preventDefault();
    }} className="flex flex-col items-start gap-2">
      <button type="submit" disabled={pending} className={buttonClassName({ variant: 'secondary', size: 'sm', className: 'text-red-600' })}>{pending ? 'Deleting…' : 'Delete'}</button>
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

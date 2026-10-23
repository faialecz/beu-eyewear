'use client';

import { useActionState, useId } from 'react';
import { buttonClassName } from '@/component/Button';
import type { CategoryFormState } from '@/lib/admin/categories';

interface Props {
  action: (previous: CategoryFormState, data: FormData) => Promise<CategoryFormState>;
  kind: 'category' | 'subcategory';
  defaults?: { name: string; slug: string; description?: string; categorySlug?: string };
  categories?: { name: string; slug: string }[];
}

const fieldClassName = 'mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm';

export default function CategoryForm({ action, kind, defaults, categories = [] }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const id = useId();
  const value = (key: 'name' | 'slug' | 'description' | 'categorySlug') => state.values?.[key] ?? defaults?.[key] ?? '';
  return (
    <form action={formAction} className="flex flex-col gap-3">
      {kind === 'subcategory' && (defaults ? (
        <input type="hidden" name="categorySlug" value={defaults.categorySlug} />
      ) : (
        <label className="text-sm font-semibold" htmlFor={`${id}-parent`}>Category
          <select id={`${id}-parent`} name="categorySlug" required defaultValue={value('categorySlug') || categories[0]?.slug} className={fieldClassName}>
            {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
          </select>
        </label>
      ))}
      <label className="text-sm font-semibold" htmlFor={`${id}-name`}>Name
        <input id={`${id}-name`} name="name" required maxLength={120} defaultValue={value('name')} className={fieldClassName} />
      </label>
      <label className="text-sm font-semibold" htmlFor={`${id}-slug`}>Slug
        <input id={`${id}-slug`} name="slug" required maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={value('slug')} className={fieldClassName} aria-describedby={defaults ? `${id}-warning` : undefined} />
      </label>
      {defaults && <p id={`${id}-warning`} className="text-xs text-muted-foreground">Changing the slug also changes the shop URLs that use it.</p>}
      {kind === 'category' && <label className="text-sm font-semibold" htmlFor={`${id}-description`}>Description
        <textarea id={`${id}-description`} name="description" rows={2} maxLength={2000} defaultValue={value('description')} className={fieldClassName} />
      </label>}
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-muted-foreground">{state.message}</p>}
      <button type="submit" disabled={pending || (kind === 'subcategory' && !defaults && categories.length === 0)} className={buttonClassName({ className: 'self-start uppercase' })}>
        {pending ? 'Saving…' : defaults ? 'Save Changes' : kind === 'category' ? 'Add Category' : 'Add Subcategory'}
      </button>
    </form>
  );
}

import { z } from 'zod';
import { SLUG_PATTERN } from '@/lib/validation/product';

export interface CategoryFormState {
  values?: Record<string, string>;
  error?: string;
  message?: string;
}

export const categoryFields = z.object({
  name: z.string().trim().min(1, 'Enter a name.').max(120, 'Name must be 120 characters or fewer.'),
  slug: z.string().trim().min(1, 'Enter a slug.').max(80, 'Slug must be 80 characters or fewer.')
    .regex(SLUG_PATTERN, 'Use lowercase letters, numbers and single hyphens for the slug.'),
});

export const categorySchema = categoryFields.extend({
  description: z.string().trim().max(2000, 'Description must be 2,000 characters or fewer.'),
});

export const subcategorySchema = categoryFields.extend({ categorySlug: categoryFields.shape.slug });

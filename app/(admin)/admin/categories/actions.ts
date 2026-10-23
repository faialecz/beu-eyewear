'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import { categoryFields, categorySchema, subcategorySchema, type CategoryFormState } from '@/lib/admin/categories';
import { prisma } from '@/lib/prisma';

function revalidateCatalog() {
  for (const path of ['/admin/categories', '/admin/products', '/admin/inventory', '/admin', '/admin/reports', '/listing', '/home', '/search']) {
    revalidatePath(path);
  }
  revalidatePath('/listing/[slug]', 'page');
}

function databaseError(error: unknown): CategoryFormState {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return { error: 'That slug is already in use. Choose another slug.' };
    if (error.code === 'P2003') return { error: 'Related records changed. Refresh and check the category, subcategories and products.' };
    if (error.code === 'P2025') return { error: 'This category or subcategory no longer exists. Refresh the page.' };
    if (error.code === 'P2034') return { error: 'Another admin changed this data. Please try again.' };
  }
  return { error: 'We couldn’t save this change. Please try again.' };
}

async function save(kind: 'category' | 'subcategory', originalSlug: string | null, formData: FormData): Promise<CategoryFormState> {
  const keys = kind === 'category' ? ['name', 'slug', 'description'] : ['name', 'slug', 'categorySlug'];
  const values = Object.fromEntries(keys.map((key) => [key, typeof formData.get(key) === 'string' ? String(formData.get(key)) : '']));
  if (originalSlug !== null && !categoryFields.shape.slug.safeParse(originalSlug).success) return { values, error: 'Invalid original slug.' };
  const parsed = (kind === 'category' ? categorySchema : subcategorySchema).safeParse(values);
  if (!parsed.success) return { values, error: parsed.error.issues[0].message };
  try {
    const error = await prisma.$transaction(async (tx) => {
      const { slug, name } = parsed.data;
      const other = originalSlug === null ? {} : { slug: { not: originalSlug } };
      if (kind === 'category') {
        const duplicate = await tx.category.findFirst({ where: { ...other, OR: [{ slug }, { name: { equals: name, mode: 'insensitive' } }] } });
        if (duplicate) return 'A category with that name or slug already exists.';
        const data = { slug, name, description: values.description.trim() };
        if (originalSlug === null) await tx.category.create({ data });
        else await tx.category.update({ where: { slug: originalSlug }, data });
      } else {
        const categorySlug = values.categorySlug.trim();
        if (!await tx.category.findUnique({ where: { slug: categorySlug } })) return 'Choose an existing parent category.';
        // Keep the parent fixed so products cannot end up in mismatched categories.
        if (originalSlug !== null) {
          const existing = await tx.subcategory.findUnique({ where: { slug: originalSlug } });
          if (!existing) return 'This subcategory no longer exists.';
          if (existing.categorySlug !== categorySlug) return 'A subcategory’s parent cannot be changed here. Refresh the page.';
        }
        const duplicate = await tx.subcategory.findFirst({ where: { ...other, OR: [{ slug }, { categorySlug, name: { equals: name, mode: 'insensitive' } }] } });
        if (duplicate) return 'That subcategory slug is in use, or its name already exists in this category.';
        const data = { slug, name, categorySlug };
        if (originalSlug === null) await tx.subcategory.create({ data });
        else await tx.subcategory.update({ where: { slug: originalSlug }, data });
      }
      return null;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (error) return { values, error };
  } catch (error) {
    return { values, ...databaseError(error) };
  }
  revalidateCatalog();
  return { message: originalSlug === null ? 'Added successfully.' : 'Changes saved.' };
}

export async function createCategory(_previous: CategoryFormState, formData: FormData) {
  await requireAdmin();
  return save('category', null, formData);
}

export async function createSubcategory(_previous: CategoryFormState, formData: FormData) {
  await requireAdmin();
  return save('subcategory', null, formData);
}

export async function updateCategory(slug: string, _previous: CategoryFormState, formData: FormData) {
  await requireAdmin();
  return save('category', slug, formData);
}

export async function updateSubcategory(slug: string, _previous: CategoryFormState, formData: FormData) {
  await requireAdmin();
  return save('subcategory', slug, formData);
}

async function remove(kind: 'category' | 'subcategory', slug: string): Promise<CategoryFormState> {
  if (!categoryFields.shape.slug.safeParse(slug).success) return { error: 'Invalid slug.' };
  try {
    const error = await prisma.$transaction(async (tx) => {
      const products = await tx.product.count({ where: kind === 'category' ? { categorySlug: slug } : { subcategorySlug: slug } });
      if (products > 0) return `Move or delete the ${products} product${products === 1 ? '' : 's'} in this ${kind} first.`;
      if (kind === 'category') {
        const children = await tx.subcategory.count({ where: { categorySlug: slug } });
        if (children > 0) return `Delete the ${children} subcategor${children === 1 ? 'y' : 'ies'} in this category first.`;
        await tx.category.delete({ where: { slug } });
      } else await tx.subcategory.delete({ where: { slug } });
      return null;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (error) return { error };
  } catch (error) {
    return databaseError(error);
  }
  revalidateCatalog();
  return { message: 'Deleted successfully.' };
}

export async function deleteCategory(slug: string) {
  await requireAdmin();
  return remove('category', slug);
}

export async function deleteSubcategory(slug: string) {
  await requireAdmin();
  return remove('subcategory', slug);
}

'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/session';
import { PRODUCT_FORM_FIELDS, type ProductFormState } from '@/lib/catalog/form-state';
import { prisma } from '@/lib/prisma';
import {
  BlobNotConfiguredError,
  deleteProductImage,
  uploadProductImage,
  validateImageFile,
} from '@/lib/storage/product-image';
import { createProductSchema, productFieldsSchema } from '@/lib/validation/product';

function uploadErrorMessage(error: unknown) {
  return error instanceof BlobNotConfiguredError
    ? 'Photo uploads aren’t set up yet: BLOB_READ_WRITE_TOKEN is missing from .env.'
    : 'We couldn’t upload the photo. Please try again.';
}

function readValues(formData: FormData): Record<string, string> {
  return Object.fromEntries(PRODUCT_FORM_FIELDS.map((key) => [key, String(formData.get(key) ?? '')]));
}

// The photo input, or null when no file was chosen (browsers still send an empty File).
function readImage(formData: FormData): File | null {
  const file = formData.get('image');
  return file instanceof File && file.size > 0 ? file : null;
}

function revalidateCatalog(slug?: string) {
  revalidatePath('/admin/products');
  revalidatePath('/listing');
  revalidatePath('/home');
  revalidatePath('/search');
  if (slug) revalidatePath(`/listing/${slug}`);
}

// The category/subcategory selects are free text on the wire, so confirm both
// exist and that the subcategory really belongs to the category.
async function categoryError(categorySlug: string, subcategorySlug: string): Promise<ProductFormState['fieldErrors']> {
  const subcategory = await prisma.subcategory.findUnique({ where: { slug: subcategorySlug } });
  if (!subcategory) return { subcategorySlug: ['Choose a valid subcategory'] };
  if (subcategory.categorySlug !== categorySlug) {
    return { subcategorySlug: ['That subcategory doesn’t belong to the chosen category'] };
  }
  return undefined;
}

export async function createProduct(_prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin();

  const values = readValues(formData);
  const image = readImage(formData);

  const parsed = createProductSchema.safeParse(values);
  const fieldErrors: NonNullable<ProductFormState['fieldErrors']> = parsed.success
    ? {}
    : z.flattenError(parsed.error).fieldErrors;

  if (image) {
    const imageError = validateImageFile(image);
    if (imageError) fieldErrors.image = [imageError];
  }
  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    return { values, fieldErrors };
  }

  const { slug, ...data } = parsed.data;
  const categoryProblem = await categoryError(data.categorySlug, data.subcategorySlug);
  if (categoryProblem) return { values, fieldErrors: categoryProblem };

  if (await prisma.product.findUnique({ where: { slug }, select: { slug: true } })) {
    return { values, fieldErrors: { slug: ['A product with this slug already exists'] } };
  }

  let imageUrl: string | undefined;
  if (image) {
    try {
      imageUrl = await uploadProductImage(slug, image);
    } catch (error) {
      console.error('uploading product image failed', error);
      return { values, error: uploadErrorMessage(error) };
    }
  }

  try {
    await prisma.product.create({ data: { slug, ...data, imageUrl } });
  } catch (error) {
    await deleteProductImage(imageUrl);
    // The primary key is the source of truth, so this also covers two admins racing.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { values, fieldErrors: { slug: ['A product with this slug already exists'] } };
    }
    console.error('createProduct failed', error);
    return { values, error: 'We couldn’t save this product. Please try again.' };
  }

  revalidateCatalog(slug);
  redirect('/admin/products');
}

export async function updateProduct(
  slug: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const values = { ...readValues(formData), slug };
  const image = readImage(formData);
  const removeImage = formData.get('removeImage') === 'on';

  const existing = await prisma.product.findUnique({ where: { slug }, select: { imageUrl: true } });
  if (!existing) return { values, error: 'This product no longer exists.' };

  const parsed = productFieldsSchema.safeParse(values);
  const fieldErrors: NonNullable<ProductFormState['fieldErrors']> = parsed.success
    ? {}
    : z.flattenError(parsed.error).fieldErrors;

  if (image) {
    const imageError = validateImageFile(image);
    if (imageError) fieldErrors.image = [imageError];
  }
  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    return { values, fieldErrors };
  }

  const categoryProblem = await categoryError(parsed.data.categorySlug, parsed.data.subcategorySlug);
  if (categoryProblem) return { values, fieldErrors: categoryProblem };

  // A new file wins over "remove"; otherwise keep whatever is there.
  let newImageUrl: string | undefined;
  if (image) {
    try {
      newImageUrl = await uploadProductImage(slug, image);
    } catch (error) {
      console.error('uploading product image failed', error);
      return { values, error: uploadErrorMessage(error) };
    }
  }
  const imageUrl = newImageUrl ?? (removeImage ? null : existing.imageUrl);

  try {
    const { frameMaterial, lensOption, frameShape, ...rest } = parsed.data;
    // Prisma ignores undefined on update, so a cleared select must be an explicit null.
    await prisma.product.update({
      where: { slug },
      data: {
        ...rest,
        frameMaterial: frameMaterial ?? null,
        lensOption: lensOption ?? null,
        frameShape: frameShape ?? null,
        imageUrl,
      },
    });
  } catch (error) {
    await deleteProductImage(newImageUrl);
    console.error('updateProduct failed', error);
    return { values, error: 'We couldn’t save your changes. Please try again.' };
  }

  // Only now that the row points at the new photo is the old one safe to drop.
  if (imageUrl !== existing.imageUrl) {
    await deleteProductImage(existing.imageUrl);
  }

  revalidateCatalog(slug);
  redirect('/admin/products');
}

export async function deleteProduct(slug: string) {
  await requireAdmin();

  const existing = await prisma.product.findUnique({ where: { slug }, select: { imageUrl: true } });
  if (existing) {
    // Order history keeps working: OrderItem snapshots the product and has no FK to it.
    await prisma.product.delete({ where: { slug } });
    await deleteProductImage(existing.imageUrl);
  }

  revalidateCatalog(slug);
  redirect('/admin/products');
}

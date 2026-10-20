'use client';

import { useActionState, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { buttonClassName } from '@/component/Button';
import { FRAME_MATERIALS, FRAME_SHAPES, LENS_OPTIONS } from '@/lib/catalog/enums';
import type { ProductFormState } from '@/lib/catalog/form-state';
import type { Category, Product, Subcategory } from '@/lib/catalog/types';
import { ACCEPTED_IMAGE_TYPES, imageFileError } from '@/lib/storage/image-rules';

const fieldClassName = 'mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm';
const labelClassName = 'text-sm font-semibold';

const initialState: ProductFormState = {};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={`${id}-error`} className="mt-1 text-xs text-red-500">
      {errors[0]}
    </p>
  );
}

export interface ProductFormProps {
  action: (prevState: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  categories: Category[];
  subcategories: Subcategory[];
  defaultValues?: Product;
  submitLabel: string;
}

export default function ProductForm({ action, categories, subcategories, defaultValues, submitLabel }: ProductFormProps) {
  const [preview, setPreview] = useState<string | null>(null);
  // Set when the chosen file is rejected in the browser, before any upload.
  const [pickedFileError, setPickedFileError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(async (prevState: ProductFormState, formData: FormData) => {
    const next = await action(prevState, formData);
    // A failed save clears the file input, so drop the stale preview with it.
    setPreview(null);
    setPickedFileError(null);
    return next;
  }, initialState);
  const isEdit = Boolean(defaultValues);
  const errors = state.fieldErrors ?? {};

  // After a failed save the action echoes what was typed; otherwise show the saved product.
  const initial = (key: string, saved: string | number | undefined) => state.values?.[key] ?? (saved === undefined ? '' : String(saved));

  const [slug, setSlug] = useState(defaultValues?.slug ?? '');
  const [slugEdited, setSlugEdited] = useState(false);
  const [categorySlug, setCategorySlug] = useState(
    defaultValues?.categorySlug ?? categories[0]?.slug ?? '',
  );
  const [removeImage, setRemoveImage] = useState(false);

  const categorySubcategories = subcategories.filter((subcategory) => subcategory.categorySlug === categorySlug);
  const savedImage = removeImage ? undefined : defaultValues?.imageUrl;
  const shownImage = preview ?? savedImage;

  // Object URLs hold the file in memory until revoked.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      <div>
        <label className={labelClassName} htmlFor="slug">
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          value={slug}
          onChange={(event) => {
            setSlug(event.target.value);
            setSlugEdited(true);
          }}
          required
          readOnly={isEdit}
          aria-invalid={Boolean(errors.slug) || undefined}
          aria-describedby={errors.slug ? 'slug-error' : undefined}
          className={`${fieldClassName} ${isEdit ? 'opacity-60' : ''}`}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {isEdit ? 'The slug is the product’s URL and can’t be changed.' : 'Used in the product’s URL. Filled in from the name; you can change it.'}
        </p>
        <FieldError id="slug" errors={errors.slug} />
      </div>

      <div>
        <label className={labelClassName} htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={initial('name', defaultValues?.name)}
          onChange={(event) => {
            if (!isEdit && !slugEdited) setSlug(slugify(event.target.value));
          }}
          required
          aria-invalid={Boolean(errors.name) || undefined}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className={fieldClassName}
        />
        <FieldError id="name" errors={errors.name} />
      </div>

      <div>
        <label className={labelClassName} htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={initial('description', defaultValues?.description)}
          required
          rows={3}
          aria-invalid={Boolean(errors.description) || undefined}
          aria-describedby={errors.description ? 'description-error' : undefined}
          className={fieldClassName}
        />
        <FieldError id="description" errors={errors.description} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClassName} htmlFor="price">
            Price (₱)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            step={1}
            defaultValue={initial('price', defaultValues?.price)}
            required
            aria-invalid={Boolean(errors.price) || undefined}
            aria-describedby={errors.price ? 'price-error' : undefined}
            className={fieldClassName}
          />
          <FieldError id="price" errors={errors.price} />
        </div>
        <div>
          <label className={labelClassName} htmlFor="stockQuantity">
            Quantity in stock
          </label>
          <input
            id="stockQuantity"
            name="stockQuantity"
            type="number"
            min={0}
            step={1}
            defaultValue={initial('stockQuantity', defaultValues?.stockQuantity ?? 0)}
            required
            aria-invalid={Boolean(errors.stockQuantity) || undefined}
            aria-describedby={errors.stockQuantity ? 'stockQuantity-error' : undefined}
            className={fieldClassName}
          />
          <FieldError id="stockQuantity" errors={errors.stockQuantity} />
        </div>
        <div>
          <label className={labelClassName} htmlFor="warrantyYears">
            Warranty (years)
          </label>
          <input
            id="warrantyYears"
            name="warrantyYears"
            type="number"
            min={0}
            step={1}
            defaultValue={initial('warrantyYears', defaultValues?.warrantyYears ?? 1)}
            required
            aria-invalid={Boolean(errors.warrantyYears) || undefined}
            aria-describedby={errors.warrantyYears ? 'warrantyYears-error' : undefined}
            className={fieldClassName}
          />
          <FieldError id="warrantyYears" errors={errors.warrantyYears} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClassName} htmlFor="categorySlug">
            Category
          </label>
          <select
            id="categorySlug"
            name="categorySlug"
            value={categorySlug}
            onChange={(event) => setCategorySlug(event.target.value)}
            required
            className={fieldClassName}
          >
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <FieldError id="categorySlug" errors={errors.categorySlug} />
        </div>
        <div>
          <label className={labelClassName} htmlFor="subcategorySlug">
            Subcategory
          </label>
          {/* Keyed on the category so switching it re-picks a valid subcategory. */}
          <select
            key={categorySlug}
            id="subcategorySlug"
            name="subcategorySlug"
            defaultValue={initial('subcategorySlug', defaultValues?.subcategorySlug)}
            required
            aria-invalid={Boolean(errors.subcategorySlug) || undefined}
            aria-describedby={errors.subcategorySlug ? 'subcategorySlug-error' : undefined}
            className={fieldClassName}
          >
            {categorySubcategories.map((subcategory) => (
              <option key={subcategory.slug} value={subcategory.slug}>
                {subcategory.name}
              </option>
            ))}
          </select>
          <FieldError id="subcategorySlug" errors={errors.subcategorySlug} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClassName} htmlFor="frameMaterial">
            Frame Material
          </label>
          <select
            id="frameMaterial"
            name="frameMaterial"
            defaultValue={initial('frameMaterial', defaultValues?.frameMaterial)}
            className={fieldClassName}
          >
            <option value="">—</option>
            {FRAME_MATERIALS.map((material) => (
              <option key={material} value={material}>
                {material}
              </option>
            ))}
          </select>
          <FieldError id="frameMaterial" errors={errors.frameMaterial} />
        </div>
        <div>
          <label className={labelClassName} htmlFor="lensOption">
            Lens Option
          </label>
          <select
            id="lensOption"
            name="lensOption"
            defaultValue={initial('lensOption', defaultValues?.lensOption)}
            className={fieldClassName}
          >
            <option value="">—</option>
            {LENS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <FieldError id="lensOption" errors={errors.lensOption} />
        </div>
        <div>
          <label className={labelClassName} htmlFor="frameShape">
            Frame Shape
          </label>
          <select
            id="frameShape"
            name="frameShape"
            defaultValue={initial('frameShape', defaultValues?.frameShape)}
            className={fieldClassName}
          >
            <option value="">—</option>
            {FRAME_SHAPES.map((shape) => (
              <option key={shape} value={shape}>
                {shape}
              </option>
            ))}
          </select>
          <FieldError id="frameShape" errors={errors.frameShape} />
        </div>
      </div>

      <div>
        <label className={labelClassName} htmlFor="colors">
          Colors (comma-separated)
        </label>
        <input
          id="colors"
          name="colors"
          defaultValue={initial('colors', defaultValues?.colors.join(', '))}
          placeholder="Matte Black, Tortoiseshell"
          aria-invalid={Boolean(errors.colors) || undefined}
          aria-describedby={errors.colors ? 'colors-error' : undefined}
          className={fieldClassName}
        />
        <FieldError id="colors" errors={errors.colors} />
      </div>

      <div>
        <label className={labelClassName} htmlFor="image">
          Product photo
        </label>
        <div className="mt-1 flex items-start gap-4">
          <div className="relative flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-card">
            {shownImage ? (
              <Image src={shownImage} alt="Product photo preview" fill sizes="96px" unoptimized className="object-cover" />
            ) : (
              <span className="px-2 text-center text-xs text-muted-foreground">No photo</span>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <input
              id="image"
              name="image"
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              onChange={(event) => {
                const file = event.target.files?.[0];
                const problem = file ? imageFileError(file) : null;
                setPickedFileError(problem);
                if (problem) {
                  // Don't submit a file the server would reject anyway.
                  event.target.value = '';
                  setPreview(null);
                  return;
                }
                setPreview(file ? URL.createObjectURL(file) : null);
              }}
              aria-invalid={Boolean(pickedFileError || errors.image) || undefined}
              aria-describedby={pickedFileError || errors.image ? 'image-error' : undefined}
              className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-semibold"
            />
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP or AVIF, up to 4 MB. Portrait photos (3:4) look best.
              {isEdit && defaultValues?.imageUrl ? ' Choosing a new file replaces the current photo.' : ''}
            </p>
            {isEdit && defaultValues?.imageUrl && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="removeImage"
                  checked={removeImage}
                  onChange={(event) => setRemoveImage(event.target.checked)}
                />
                Remove current photo
              </label>
            )}
          </div>
        </div>
        <FieldError id="image" errors={pickedFileError ? [pickedFileError] : errors.image} />
      </div>

      <p aria-live="polite" className="min-h-5 text-sm text-red-500">
        {state.error}
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className={buttonClassName({ variant: 'primary', className: 'uppercase' })}
        >
          {pending ? 'Saving…' : submitLabel}
        </button>
        <Link href="/admin/products" className={buttonClassName({ variant: 'ghost' })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

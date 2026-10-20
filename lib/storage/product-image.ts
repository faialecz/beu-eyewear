import 'server-only';

import { del, put } from '@vercel/blob';
import { IMAGE_EXTENSIONS, imageFileError } from '@/lib/storage/image-rules';

export { MAX_IMAGE_BYTES } from '@/lib/storage/image-rules';

// Thrown when no Vercel Blob store is connected, so the admin can be told the
// real reason instead of a generic "try again".
export class BlobNotConfiguredError extends Error {
  constructor() {
    super('BLOB_READ_WRITE_TOKEN is not set');
  }
}

// Returns an error message, or null when the file is acceptable.
export function validateImageFile(file: File): string | null {
  return imageFileError(file);
}

export async function uploadProductImage(slug: string, file: File): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new BlobNotConfiguredError();

  const blob = await put(`products/${slug}.${IMAGE_EXTENSIONS[file.type]}`, file, {
    access: 'public',
    addRandomSuffix: true,
    contentType: file.type,
  });
  return blob.url;
}

// Best-effort: an orphaned blob is harmless, but a failed cleanup must never
// turn a saved product into an error.
export async function deleteProductImage(url: string | null | undefined) {
  if (!url) return;
  try {
    await del(url);
  } catch (error) {
    console.error('deleting product image failed', error);
  }
}

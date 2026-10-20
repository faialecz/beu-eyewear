// Shared by the product form (checks before uploading) and the server (the
// authoritative check). No 'server-only' on purpose so both sides can import it.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export const ACCEPTED_IMAGE_TYPES = Object.keys(IMAGE_EXTENSIONS).join(',');

// Returns an error message, or null when the file is acceptable.
export function imageFileError(file: { type: string; size: number }): string | null {
  if (!(file.type in IMAGE_EXTENSIONS)) return 'Photo must be a JPG, PNG, WebP or AVIF image.';
  if (file.size > MAX_IMAGE_BYTES) return 'Photo must be 4 MB or smaller.';
  return null;
}

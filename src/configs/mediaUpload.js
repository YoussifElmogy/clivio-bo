import { API_BASE_URL } from './apiClient';

/** Override with VITE_MEDIA_UPLOAD_PATH if your API uses a different route (under VITE_API_BASE_URL). */
export const MEDIA_UPLOAD_PATH =
  import.meta.env.VITE_MEDIA_UPLOAD_PATH?.trim() || '/media/upload';

/**
 * Turns relative paths from the API into absolute URLs for <img src>.
 */
export function toAbsoluteMediaUrl(pathOrUrl) {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return '';
  const t = pathOrUrl.trim();
  if (t.startsWith('http://') || t.startsWith('https://') || t.startsWith('data:')) {
    return t;
  }
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}/${t.replace(/^\//, '')}`;
}

export function extractUrlFromUploadResponse(data) {
  if (!data || typeof data !== 'object') return null;
  if (typeof data.url === 'string') return data.url;
  if (typeof data.file_url === 'string') return data.file_url;
  if (typeof data.image_url === 'string') return data.image_url;
  if (data.data && typeof data.data === 'object') {
    const d = data.data;
    if (typeof d.url === 'string') return d.url;
    if (typeof d.file_url === 'string') return d.file_url;
  }
  return null;
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * POST multipart file; returns absolute URL for storage in configuration.
 */
export async function uploadMediaFile(post, file, { path = MEDIA_UPLOAD_PATH } = {}) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image must be 8 MB or smaller');
  }
  const fd = new FormData();
  fd.append('file', file);
  const data = await post(path, fd);
  const raw = extractUrlFromUploadResponse(data);
  if (!raw) {
    throw new Error('Upload did not return a URL. Check the API response shape.');
  }
  return toAbsoluteMediaUrl(raw);
}

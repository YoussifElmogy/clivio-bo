/** Backend accepts up to this many files per bulk attachment upload. */
export const ATTACHMENT_UPLOAD_MAX_FILES = 10;

/**
 * @param {FileList|File[]|null|undefined} fileList
 * @returns {{ files: File[], truncated: boolean }}
 */
export function pickAttachmentFiles(fileList, max = ATTACHMENT_UPLOAD_MAX_FILES) {
  const incoming = Array.from(fileList ?? []).filter(Boolean);
  if (incoming.length <= max) {
    return { files: incoming, truncated: false };
  }
  return { files: incoming.slice(0, max), truncated: true };
}

/** One FormData with each file appended as `file` (bulk upload). */
export function buildAttachmentsFormData(files) {
  const formData = new FormData();
  (Array.isArray(files) ? files : []).forEach(file => {
    if (file) formData.append('file', file);
  });
  return formData;
}

export function formatSelectedAttachmentNames(files) {
  const list = Array.isArray(files) ? files : [];
  if (!list.length) return 'No files selected';
  if (list.length === 1) return list[0].name;
  return `${list.length} files selected`;
}

function attachmentNameHint(row) {
  return String(
    row?.file_name ?? row?.filename ?? row?.name ?? row?.original_name ?? row?.file_url ?? row?.url ?? ''
  ).toLowerCase();
}

function attachmentMime(row) {
  return String(row?.content_type ?? row?.mime_type ?? row?.mimetype ?? '').toLowerCase();
}

/** iPhone HEIC/HEIF — most Chromium browsers cannot paint these in <img> without conversion. */
export function isAttachmentHeic(row) {
  const mime = attachmentMime(row);
  if (
    mime === 'image/heic' ||
    mime === 'image/heif' ||
    mime === 'image/heic-sequence' ||
    mime === 'image/heif-sequence'
  ) {
    return true;
  }
  return /\.(heic|heif)(\?|#|$)/i.test(attachmentNameHint(row));
}

export function isAttachmentImage(row) {
  const mime = attachmentMime(row);
  if (mime.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)(\?|#|$)/i.test(attachmentNameHint(row));
}

/**
 * Avoid www vs apex CORS: if the file host matches the page host ignoring `www.`,
 * rewrite to the current page origin so fetch() is same-origin.
 *
 * Example: page `https://www.reve-online.info` + file `https://reve-online.info/media/a.HEIC`
 *       → `https://www.reve-online.info/media/a.HEIC`
 */
export function sameOriginMediaUrl(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return '';
  if (typeof window === 'undefined') {
    if (/^https?:\/\//i.test(value)) return value;
    return value.startsWith('/') ? value : `/${value.replace(/^\/+/, '')}`;
  }

  try {
    const abs = new URL(value, window.location.origin);
    const pageHost = window.location.hostname.replace(/^www\./i, '').toLowerCase();
    const fileHost = abs.hostname.replace(/^www\./i, '').toLowerCase();
    if (fileHost && fileHost === pageHost) {
      return `${window.location.origin}${abs.pathname}${abs.search}${abs.hash}`;
    }
    return abs.href;
  } catch {
    return value.startsWith('/') ? value : `/${value.replace(/^\/+/, '')}`;
  }
}

export function attachmentViewUrl(row) {
  const raw =
    row?.file_url ||
    row?.url ||
    row?.file ||
    row?.path ||
    row?.attachment_url ||
    row?.download_url ||
    '';
  if (!raw) return '';
  const value = String(raw).trim();
  if (!value) return '';
  // Keep absolute CDN/API URLs as-is for <img> (cross-origin display is fine).
  // HEIC conversion uses sameOriginMediaUrl() separately to avoid www↔apex CORS.
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return value;
  return `/${value.replace(/^\/+/, '')}`;
}

export function attachmentDisplayName(row) {
  return (
    row?.file_name ||
    row?.filename ||
    row?.name ||
    row?.original_name ||
    'Attachment'
  );
}

const heicPreviewCache = new Map();

async function fetchMediaBlob(sourceUrl) {
  const candidates = [];
  const sameOrigin = sameOriginMediaUrl(sourceUrl);
  const original = String(sourceUrl ?? '').trim();
  if (sameOrigin) candidates.push(sameOrigin);
  if (original && original !== sameOrigin) candidates.push(original);

  let lastError = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        credentials: 'include',
        cache: 'no-cache',
      });
      if (!res.ok) {
        lastError = new Error(`HEIC fetch failed (${res.status})`);
        continue;
      }
      return res.blob();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error('HEIC fetch failed');
}

/**
 * Fetch a HEIC/HEIF URL (same-origin rewritten) and convert to a JPEG object URL.
 * Results are cached by source URL. Returns '' on failure.
 */
export async function heicSourceToPreviewUrl(sourceUrl) {
  const key = sameOriginMediaUrl(sourceUrl);
  if (!key) return '';
  if (heicPreviewCache.has(key)) return heicPreviewCache.get(key);

  const pending = (async () => {
    try {
      const blob = await fetchMediaBlob(key);
      const { heicTo } = await import('heic-to');
      const jpegBlob = await heicTo({
        blob,
        type: 'image/jpeg',
        quality: 0.85,
      });
      if (!jpegBlob) return '';
      return URL.createObjectURL(jpegBlob);
    } catch {
      return '';
    }
  })();

  heicPreviewCache.set(key, pending);
  const result = await pending;
  heicPreviewCache.set(key, Promise.resolve(result));
  return result;
}

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
  if (mime === 'image/heic' || mime === 'image/heif' || mime === 'image/heic-sequence' || mime === 'image/heif-sequence') {
    return true;
  }
  return /\.(heic|heif)(\?|#|$)/i.test(attachmentNameHint(row));
}

export function isAttachmentImage(row) {
  const mime = attachmentMime(row);
  if (mime.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)(\?|#|$)/i.test(attachmentNameHint(row));
}

const heicPreviewCache = new Map();

/**
 * Fetch a HEIC/HEIF URL and convert to a JPEG object URL for <img> preview.
 * Results are cached by source URL. Returns '' on failure.
 */
export async function heicSourceToPreviewUrl(sourceUrl) {
  const key = String(sourceUrl ?? '').trim();
  if (!key) return '';
  if (heicPreviewCache.has(key)) return heicPreviewCache.get(key);

  const pending = (async () => {
    try {
      const { default: heic2any } = await import('heic2any');
      const res = await fetch(key);
      if (!res.ok) throw new Error(`HEIC fetch failed (${res.status})`);
      const blob = await res.blob();
      const converted = await heic2any({
        blob,
        toType: 'image/jpeg',
        quality: 0.85,
      });
      const jpegBlob = Array.isArray(converted) ? converted[0] : converted;
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

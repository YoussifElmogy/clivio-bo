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

export function isAttachmentImage(row) {
  const mime = String(row?.content_type ?? row?.mime_type ?? row?.mimetype ?? '').toLowerCase();
  if (mime.startsWith('image/')) return true;
  const name = String(
    row?.file_name ?? row?.filename ?? row?.name ?? row?.file_url ?? row?.url ?? ''
  ).toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(name);
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

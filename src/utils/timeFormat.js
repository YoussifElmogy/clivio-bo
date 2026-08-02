import dayjs from 'dayjs';

/**
 * Formats backend ISO timestamps (e.g. `2026-05-13T21:39:48.342946Z`) for display.
 * @param {unknown} value
 * @returns {string} e.g. "May 13, 2026 · 9:39 PM" in local time, or "" if empty/invalid
 */
export function formatIsoDateTimeDisplay(value) {
  if (value == null || value === '') return '';
  const d = dayjs(String(value).trim());
  if (!d.isValid()) return String(value).trim();
  return d.format('MMM D, YYYY · h:mm A');
}

/**
 * Secondary line for attachment lists: uploader + formatted `created_at`.
 * @param {Record<string, unknown>} att
 * @returns {string|null}
 */
export function formatAttachmentSecondaryLine(att) {
  if (!att || typeof att !== 'object') return null;
  const parts = [];
  const uploader = att.uploaded_by_name;
  if (typeof uploader === 'string' && uploader.trim()) {
    parts.push(`Uploaded by ${uploader.trim()}`);
  }
  const dt = formatIsoDateTimeDisplay(att.created_at);
  if (dt) parts.push(dt);
  return parts.length ? parts.join(' · ') : null;
}

/**
 * @param {string} hhmm - "14:00" or "09:05"
 * @returns {string} e.g. "2:00 PM", "9:05 AM"
 */
export function formatHhmmToAmPm(hhmm) {
  if (hhmm == null || typeof hhmm !== 'string') return '';
  const t = hhmm.trim();
  const m = t.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!m) return t;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${min} ${ampm}`;
}

/**
 * @param {string} [from]
 * @param {string} [to]
 * @returns {string} e.g. "2:00 PM – 10:00 PM"
 */
export function formatTimeRangeAmPm(from, to) {
  const a = from != null && String(from).trim() !== '' ? formatHhmmToAmPm(sliceHhmm(from)) : '';
  const b = to != null && String(to).trim() !== '' ? formatHhmmToAmPm(sliceHhmm(to)) : '';
  if (!a && !b) return '';
  if (!a) return b;
  if (!b) return a;
  return `${a} – ${b}`;
}

function sliceHhmm(t) {
  const s = String(t).trim();
  return s.length >= 5 ? s.slice(0, 5) : s;
}

/**
 * Formats reservation `arrival_date` for listing — time only (local).
 * Accepts ISO datetime or HH:mm(:ss) strings.
 * @param {unknown} value
 * @returns {string} e.g. "2:30 PM", or "" if empty/invalid
 */
export function formatArrivalTimeDisplay(value) {
  if (value == null || String(value).trim() === '') return '';
  const raw = String(value).trim();
  if (/^\d{1,2}:\d{2}/.test(raw) && !raw.includes('T') && !/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const hhmm = sliceHhmm(raw);
    return formatHhmmToAmPm(hhmm) || hhmm;
  }
  const d = dayjs(raw);
  if (!d.isValid()) return '';
  return d.format('h:mm A');
}

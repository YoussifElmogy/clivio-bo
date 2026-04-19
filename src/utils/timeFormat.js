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

/** Normalize hex for HTML color input (6-digit). */
export function normalizeHexForPicker(hex, emptyFallback = '#000000') {
  if (!hex || typeof hex !== 'string' || String(hex).trim() === '') {
    return emptyFallback;
  }
  const h = hex.trim();
  if (/^#[0-9A-Fa-f]{3}$/.test(h)) {
    const r = h[1];
    const g = h[2];
    const b = h[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  if (/^#[0-9A-Fa-f]{6}$/i.test(h)) return h.slice(0, 7);
  return emptyFallback;
}

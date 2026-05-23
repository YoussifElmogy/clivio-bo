/** Parse Vite env booleans; unset env defaults to `defaultWhenUnset`. */
function envTabVisibleFlag(envKey, defaultWhenUnset = true) {
  const raw = import.meta.env[envKey];
  if (raw == null || String(raw).trim() === '') return defaultWhenUnset;
  const v = String(raw).trim().toLowerCase();
  if (v === 'false' || v === '0' || v === 'no') return false;
  return v === 'true' || v === '1' || v === 'yes';
}

/**
 * Derma appointment tabs: `true` = show tab, `false` = hide completely.
 * Restart dev server after `.env` changes.
 */
export const DERMA_APPOINTMENT_TABS = {
  APPOINTMENT_SUMMARY: envTabVisibleFlag('VITE_DERMA_APPOINTMENT_SUMMARY_VIEW_ONLY'),
  FACE_MAP: envTabVisibleFlag('VITE_DERMA_FACE_MAP_VIEW_ONLY'),
  BODY_MAP: envTabVisibleFlag('VITE_DERMA_BODY_MAP_VIEW_ONLY'),
};

import { BODY_MAP_ZONES } from './bodyMapZones';

/** First id for doctor-defined zones (not on the body map image). */
export const CUSTOM_BODY_ZONE_ID_START = 6;

const MAP_ZONE_IDS = new Set(BODY_MAP_ZONES.map(z => z.id));

export function isMapBodyZoneId(zoneId) {
  const id = Number(zoneId);
  return Number.isFinite(id) && MAP_ZONE_IDS.has(id);
}

export function isAdditionalBodyZoneInternalId(zoneId) {
  if (typeof zoneId === 'string' && zoneId.startsWith('additional-')) return true;
  const id = Number(zoneId);
  if (Number.isFinite(id) && id < 0) return true;
  return Number.isFinite(id) && id >= CUSTOM_BODY_ZONE_ID_START && !MAP_ZONE_IDS.has(id);
}

/** Stable client id — never reuses body-map ids 1–5 or mapping row ids that could collide. */
export function additionalBodyZoneInternalId({ zoneMappingId, apiZoneId, tempId }) {
  if (apiZoneId != null && apiZoneId >= CUSTOM_BODY_ZONE_ID_START) return apiZoneId;
  if (zoneMappingId != null && zoneMappingId > 0) return `additional-${zoneMappingId}`;
  return tempId;
}

export function isCustomBodyZone(zone) {
  if (!zone) return false;
  if (zone.isCustom === true) return true;
  return isAdditionalBodyZoneInternalId(zone.id);
}

export function createCustomBodyZone({ id, label }) {
  const trimmed = typeof label === 'string' ? label.trim() : '';
  if (!trimmed) return null;
  return {
    id,
    label: trimmed,
    isCustom: true,
  };
}

/** Temporary client id for additional zones not yet saved (never shown in UI). */
export function nextCustomBodyZoneId(existingZones = []) {
  let min = 0;
  existingZones.forEach(zone => {
    if (zone?.isCustom !== true) return;
    const id = Number(zone?.id);
    if (Number.isFinite(id) && id < 0) min = Math.min(min, id);
  });
  return min - 1;
}

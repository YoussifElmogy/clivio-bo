import { FACE_MAP_ZONES } from './faceMapZones';

/** First id for doctor-defined zones (not on the face map image). */
export const CUSTOM_FACE_ZONE_ID_START = 9;

const MAP_ZONE_IDS = new Set(FACE_MAP_ZONES.map(z => z.id));

export function isMapFaceZoneId(zoneId) {
  const id = Number(zoneId);
  return Number.isFinite(id) && MAP_ZONE_IDS.has(id);
}

export function isAdditionalZoneInternalId(zoneId) {
  if (typeof zoneId === 'string' && zoneId.startsWith('additional-')) return true;
  const id = Number(zoneId);
  if (Number.isFinite(id) && id < 0) return true;
  return Number.isFinite(id) && id >= CUSTOM_FACE_ZONE_ID_START && !MAP_ZONE_IDS.has(id);
}

/** Stable client id — never reuses face-map ids 1–8 or mapping row ids that could collide. */
export function additionalZoneInternalId({ zoneMappingId, apiZoneId, tempId }) {
  if (apiZoneId != null && apiZoneId >= CUSTOM_FACE_ZONE_ID_START) return apiZoneId;
  if (zoneMappingId != null && zoneMappingId > 0) return `additional-${zoneMappingId}`;
  return tempId;
}

export function isCustomFaceZone(zone) {
  if (!zone) return false;
  if (zone.isCustom === true) return true;
  return isAdditionalZoneInternalId(zone.id);
}

export function createCustomFaceZone({ id, label }) {
  const trimmed = typeof label === 'string' ? label.trim() : '';
  if (!trimmed) return null;
  return {
    id,
    label: trimmed,
    isCustom: true,
  };
}

/** Temporary client id for additional zones not yet saved (never shown in UI). */
export function nextCustomFaceZoneId(existingZones = []) {
  let min = 0;
  existingZones.forEach(zone => {
    if (zone?.isCustom !== true) return;
    const id = Number(zone?.id);
    if (Number.isFinite(id) && id < 0) min = Math.min(min, id);
  });
  return min - 1;
}

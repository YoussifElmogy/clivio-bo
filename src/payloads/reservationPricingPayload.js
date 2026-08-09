/**
 * POST /reservation-pricing — priced line items for review / checkout.
 */

import { buildGeneralServicesApiPayload } from './generalServicePayload';
import { buildDermaFaceMappingPayloadFromAssignments } from './dermaFaceMappingPayload';

export const RESERVATION_PRICING_URL = '/reservation-pricing';

function hasDermaMappingAssignments(assignmentsRecord) {
  const mapping = buildDermaFaceMappingPayloadFromAssignments(assignmentsRecord ?? {}, {});
  return Array.isArray(mapping?.zones) && mapping.zones.length > 0;
}

/**
 * Pricing API applies to visit type / general services and saved face or body mapping — not laser packages alone.
 */
export function shouldFetchReservationPricing({
  prescriptionSnapshot = null,
  faceAssignments = {},
  bodyAssignments = {},
} = {}) {
  const general_services = buildGeneralServicesApiPayload(prescriptionSnapshot?.general_services ?? []);
  if (general_services.length > 0) return true;
  if (hasDermaMappingAssignments(faceAssignments)) return true;
  if (hasDermaMappingAssignments(bodyAssignments)) return true;
  return false;
}

/**
 * @param {{
 *   reservationId: number|string,
 *   generalServices?: Array<{ general_service_id?: number, price?: number|string|null }>|null,
 * }} input
 */
export function buildReservationPricingPayload({ reservationId, generalServices = null }) {
  const rid = Number(reservationId);
  const payload = {
    reservation_id: Number.isFinite(rid) ? rid : reservationId,
  };

  const general_services = buildGeneralServicesApiPayload(generalServices);
  if (general_services.length) {
    payload.general_services = general_services;
  }

  return payload;
}

/** Stable key so pricing is fetched once per meaningful input change (avoids effect loops). */
export function buildReservationPricingFetchKey({
  reservationId,
  prescriptionSnapshot = null,
  faceAssignments = {},
  bodyAssignments = {},
} = {}) {
  if (
    !reservationId ||
    !shouldFetchReservationPricing({ prescriptionSnapshot, faceAssignments, bodyAssignments })
  ) {
    return '';
  }

  const payload = buildReservationPricingPayload({
    reservationId,
    generalServices: prescriptionSnapshot?.general_services ?? null,
  });
  const faceMapping = buildDermaFaceMappingPayloadFromAssignments(faceAssignments ?? {}, {});
  const bodyMapping = buildDermaFaceMappingPayloadFromAssignments(bodyAssignments ?? {}, {});

  return JSON.stringify({
    reservation_id: payload.reservation_id,
    general_services: payload.general_services ?? [],
    face_zones: faceMapping.zones ?? [],
    body_zones: bodyMapping.zones ?? [],
  });
}

export function collectGeneralServiceIdsFromPrescription(prescription) {
  if (!prescription || typeof prescription !== 'object') return [];
  if (Array.isArray(prescription.general_services) && prescription.general_services.length) {
    return prescription.general_services
      .map(row => Number(row?.general_service_id ?? row?.id))
      .filter(id => Number.isFinite(id) && id > 0);
  }
  if (Array.isArray(prescription.general_service_ids)) {
    return prescription.general_service_ids;
  }
  const single = prescription.general_service_id ?? prescription.general_service?.id;
  if (single != null && single !== '') return [single];
  return [];
}

function parseMoney(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {unknown} data
 * @returns {{ items: object[], grand_total: number|null, grand_total_raw: string|null }}
 */
export function normalizeReservationPricingResponse(data) {
  const root = data && typeof data === 'object' ? data : {};
  const items = Array.isArray(root.items) ? root.items : [];

  return {
    items: items.map((row, index) => ({
      id: `${row?.source ?? 'item'}-${index}`,
      source: row?.source ?? null,
      zone_label: row?.zone_label ?? null,
      service_name: row?.service_name ?? null,
      line_type: row?.line_type ?? null,
      name: row?.name ?? '—',
      detail: row?.detail ?? null,
      unit_price: row?.unit_price ?? null,
      unit_price_number: parseMoney(row?.unit_price),
      total: row?.total ?? null,
      total_number: parseMoney(row?.total),
    })),
    grand_total: parseMoney(root.grand_total),
    grand_total_raw:
      typeof root.grand_total === 'string' ? root.grand_total : String(root.grand_total ?? ''),
  };
}

export function reservationPricingSourceLabel(source) {
  switch (source) {
    case 'face_mapping':
      return 'Face';
    case 'body_mapping':
      return 'Body';
    case 'general_service':
      return 'Visit type';
    default:
      return source ? String(source).replace(/_/g, ' ') : 'Other';
  }
}

/**
 * POST /reservation-pricing — priced line items for review / checkout.
 */

export const RESERVATION_PRICING_URL = '/reservation-pricing';

/**
 * @param {{
 *   reservationId: number|string,
 *   generalServiceIds?: Array<number|string>,
 * }} input
 */
export function buildReservationPricingPayload({ reservationId, generalServiceIds = [] }) {
  const rid = Number(reservationId);
  const ids = (Array.isArray(generalServiceIds) ? generalServiceIds : [])
    .map(id => Number(id))
    .filter(id => Number.isFinite(id) && id > 0);

  return {
    reservation_id: Number.isFinite(rid) ? rid : reservationId,
    general_service_ids: ids,
  };
}

export function collectGeneralServiceIdsFromPrescription(prescription) {
  if (!prescription || typeof prescription !== 'object') return [];
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

import { DERMA_MAPPING_TYPE } from './dermaFaceMappingPayload';
import { buildDermaFaceMappingPayloadFromAssignments } from './dermaFaceMappingPayload';

/**
 * Full derma visit review / checkout document for backend.
 *
 * Submit (future): POST /reservations/:reservation_id/derma-review-request
 */

export function dermaReviewRequestUrl(reservationId) {
  return `/reservations/${encodeURIComponent(reservationId)}/derma-review-request`;
}

/**
 * @param {{
 *   reservationId: string|number,
 *   patientId: string|number,
 *   faceAssignments?: Record<string, object>,
 *   bodyAssignments?: Record<string, object>,
 *   prescription?: object | null,
 *   totalPrice?: number | null,
 *   currency?: string,
 * }} input
 */
export function buildDermaReviewRequestPayload({
  reservationId,
  patientId,
  faceAssignments = {},
  bodyAssignments = {},
  prescription = null,
  totalPrice = null,
  currency = 'EGP',
}) {
  const faceMapping = buildDermaFaceMappingPayloadFromAssignments(faceAssignments, {
    reservationId,
    patientId,
    mappingType: DERMA_MAPPING_TYPE.FACE,
  });

  const bodyMapping = buildDermaFaceMappingPayloadFromAssignments(bodyAssignments, {
    reservationId,
    patientId,
    mappingType: DERMA_MAPPING_TYPE.BODY,
  });

  const medicines = Array.isArray(prescription?.medicines)
    ? prescription.medicines.map(m => ({
        name: String(m?.name ?? '').trim(),
        description: String(m?.description ?? '').trim(),
      }))
    : [];

  return {
    reservation_id: Number(reservationId),
    patient_id: Number(patientId),
    visit_type: prescription?.visit_type ?? 'consultation',
    is_examination: Boolean(prescription?.is_examination),
    prescription: {
      medicines,
      patient: prescription?.patient ?? null,
      attachments_count: prescription?.attachments_count ?? 0,
    },
    face_mapping: faceMapping,
    body_mapping: bodyMapping,
    pricing: {
      total_price: totalPrice != null && Number.isFinite(Number(totalPrice)) ? Number(totalPrice) : null,
      currency,
      /** Backend will calculate line items; null until priced. */
      line_items: null,
    },
  };
}

export const SAMPLE_DERMA_REVIEW_REQUEST_PAYLOAD = {
  reservation_id: 16,
  patient_id: 12,
  visit_type: 'consultation',
  is_examination: false,
  prescription: {
    medicines: [{ name: 'Vitamin C serum', description: 'Apply nightly' }],
    patient: { id: 12, name: 'Laila Ibrahim', age: 28 },
    attachments_count: 2,
  },
  face_mapping: {
    reservation_id: 16,
    patient_id: 12,
    mapping_type: 'face',
    zones: [
      {
        zone_id: 8,
        zone_label: 'Forehead',
        service: { id: 2, name: 'Botox', category: 'injectable', category_display: 'Injectable' },
        lines: [
          {
            line_type: 'product',
            product_id: 10,
            product_name: 'Botox 100u',
            product_type: 'syringe',
            quantity: 1,
          },
        ],
      },
    ],
  },
  body_mapping: {
    reservation_id: 16,
    patient_id: 12,
    mapping_type: 'body',
    zones: [],
  },
  pricing: {
    total_price: 4500,
    currency: 'EGP',
    line_items: null,
  },
};

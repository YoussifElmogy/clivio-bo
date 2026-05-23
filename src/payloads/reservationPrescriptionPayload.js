import { collectGeneralServiceIdsFromPrescription } from './reservationPricingPayload';

/**
 * POST /reservations/:reservation_id/prescription
 */

export function reservationPrescriptionUrl(reservationId) {
  return `/reservations/${encodeURIComponent(reservationId)}/prescription`;
}

function parseDiscount(value) {
  if (value === '' || value == null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Number(n.toFixed(2));
}

/**
 * @param {Array<{ name?: string, description?: string }>} medicines
 * @returns {Array<{ description: string }>}
 */
export function buildPrescriptionMedicinesForApi(medicines) {
  return (Array.isArray(medicines) ? medicines : [])
    .map(m => {
      const name = String(m?.name ?? '').trim();
      const desc = String(m?.description ?? '').trim();
      const description = [name, desc].filter(Boolean).join(' - ');
      return description ? { description } : null;
    })
    .filter(Boolean);
}

/**
 * @param {{
 *   doctorId: number|string,
 *   patientId: number|string,
 *   prescriptionSnapshot?: object | null,
 *   discount?: number|string,
 * }} input
 */
export function buildReservationPrescriptionPayload({
  doctorId,
  patientId,
  prescriptionSnapshot = null,
  discount,
}) {
  const did = Number(doctorId);
  const pid = Number(patientId);

  const general_service_ids = collectGeneralServiceIdsFromPrescription(prescriptionSnapshot);

  const payload = {
    doctor_id: did,
    patient_id: pid,
    medicines: buildPrescriptionMedicinesForApi(prescriptionSnapshot?.medicines),
  };

  if (general_service_ids.length) {
    payload.general_service_ids = general_service_ids;
  }

  const parsedDiscount = parseDiscount(discount);
  if (parsedDiscount != null) payload.discount = parsedDiscount;

  return payload;
}

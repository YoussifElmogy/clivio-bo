import { validateUsedPackagesForSubmit } from './appointmentLaserPackagesPayload';
import { buildGeneralServicesApiPayload } from './generalServicePayload';

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
 *   usedPackages?: object[] | null,
 *   pulsePackages?: object[] | null,
 * }} input
 */
export function buildReservationPrescriptionPayload({
  doctorId,
  patientId,
  prescriptionSnapshot = null,
  discount,
  usedPackages = null,
  pulsePackages = null,
}) {
  const did = Number(doctorId);
  const pid = Number(patientId);

  const general_services = buildGeneralServicesApiPayload(prescriptionSnapshot?.general_services);

  const payload = {
    doctor_id: did,
    patient_id: pid,
    medicines: buildPrescriptionMedicinesForApi(prescriptionSnapshot?.medicines),
  };

  if (general_services.length) {
    payload.general_services = general_services;
  }

  const parsedDiscount = parseDiscount(discount);
  if (parsedDiscount != null) payload.discount = parsedDiscount;

  const packageResult = validateUsedPackagesForSubmit(usedPackages, {
    pulsePackages: Array.isArray(pulsePackages) ? pulsePackages : [],
  });
  if (!packageResult.ok) {
    const err = new Error(packageResult.message || 'Invalid laser package selection.');
    err.validationMessage = packageResult.message;
    throw err;
  }
  if (packageResult.used_packages.length > 0) {
    payload.used_packages = packageResult.used_packages;
  }

  return payload;
}

import { isDermaClinicMode } from '../constants/clinicMode';

/**
 * Doctor appointment detail route: prescription summary vs derma zone mapping.
 * @param {{ reservationId: string|number, patientId: string|number, user?: object|null }} opts
 */
export function getDoctorAppointmentViewPath({ reservationId, patientId, user }) {
  const rid = encodeURIComponent(String(reservationId));
  const pid = encodeURIComponent(String(patientId));
  if (isDermaClinicMode(user)) {
    return `/appointments/${rid}/derma-mapping?patient_id=${pid}`;
  }
  return `/appointments/${rid}/view?patient_id=${pid}`;
}

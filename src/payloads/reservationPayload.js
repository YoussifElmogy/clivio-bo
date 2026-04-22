import { RESERVATION_STATUS } from '../constants/reservationStatus';

const STATUS_SET = new Set([
  RESERVATION_STATUS.PENDING,
  RESERVATION_STATUS.CONFIRMED,
  RESERVATION_STATUS.ARRIVED,
  RESERVATION_STATUS.CANCELED,
]);

/**
 * Some APIs wrap the entity (e.g. `{ data: { ... } }`).
 * Returns the flat reservation object when possible.
 */
export function unwrapReservationDetail(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  if (raw.id != null && (raw.date_of_visit != null || raw.slot != null || raw.status != null)) {
    return raw;
  }
  const inner = raw.data ?? raw.reservation ?? raw.result;
  return inner && typeof inner === 'object' ? inner : raw;
}

/** e.g. `"20:00:00"` → `"20:00"` for form + slot API */
export function normalizeReservationSlot(value) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\.\d+)?$/);
  if (m) {
    const h = Math.min(23, parseInt(m[1], 10));
    const min = Math.min(59, parseInt(m[2], 10));
    if (!Number.isNaN(h) && !Number.isNaN(min)) {
      return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    }
  }
  return s.length >= 5 ? s.slice(0, 5) : s;
}

/**
 * Maps GET /reservations/:id (or list row) into react-hook-form values for the edit screen.
 * Supports payloads like:
 * `{ id, branch_id?, branch_name, doctor_id?, doctor_name, patient_name, date_of_visit, slot, status, created_at }`
 */
export function mapReservationApiToForm(data) {
  const row = unwrapReservationDetail(data);

  if (!row || typeof row !== 'object') {
    return {
      branchId: '',
      doctorId: '',
      appointmentDay: '',
      appointmentTime: '',
      status: RESERVATION_STATUS.PENDING,
    };
  }

  const rawStatus = String(row.status ?? '').toLowerCase();
  const status = STATUS_SET.has(rawStatus) ? rawStatus : RESERVATION_STATUS.PENDING;

  const branchId =
    row.branch_id ??
    row.branchId ??
    (row.branch && typeof row.branch === 'object' ? row.branch.id : null);
  const doctorId =
    row.doctor_id ??
    row.doctorId ??
    (row.doctor && typeof row.doctor === 'object' ? row.doctor.id : null);

  const dateRaw =
    row.date_of_visit ??
    row.dateOfVisit ??
    row.visit_date ??
    (row.visit && typeof row.visit === 'object' ? row.visit.date : '') ??
    '';
  const slotRaw =
    row.slot ??
    row.visit_slot ??
    row.time_slot ??
    (row.visit && typeof row.visit === 'object' ? row.visit.slot : '') ??
    '';

  const appointmentDay = String(dateRaw).trim().slice(0, 10);
  const appointmentTime = normalizeReservationSlot(slotRaw);

  return {
    branchId: branchId != null && branchId !== '' ? String(branchId) : '',
    doctorId: doctorId != null && doctorId !== '' ? String(doctorId) : '',
    appointmentDay,
    appointmentTime,
    status,
  };
}

export function buildReservationPatchPayload(values) {
  return {
    branch_id: Number(values.branchId),
    doctor_id: Number(values.doctorId),
    date_of_visit: String(values.appointmentDay ?? '').trim(),
    slot: normalizeReservationSlot(values.appointmentTime),
    status: String(values.status ?? '').trim().toLowerCase(),
  };
}

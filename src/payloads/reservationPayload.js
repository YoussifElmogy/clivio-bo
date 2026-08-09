import { RESERVATION_STATUS } from '../constants/reservationStatus';

const STATUS_SET = new Set([
  RESERVATION_STATUS.PENDING,
  RESERVATION_STATUS.CONFIRMED,
  RESERVATION_STATUS.ARRIVED,
  RESERVATION_STATUS.FINISHED,
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
 * `{ id, branch_id?, branch_name, doctor_id?, doctor_name, patient_name, patient_mobile?, date_of_visit, slot, status, created_at }`
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

export function buildReservationsListQuery({
  search,
  status,
  dateOfVisit,
  doctorId,
  page,
  pageSize,
  sort = 'asc',
}) {
  const params = new URLSearchParams();
  const q = String(search ?? '').trim();
  if (q) params.set('search', q);
  const st = String(status ?? '').trim();
  if (st) params.set('status', st);
  const d = String(dateOfVisit ?? '').trim();
  if (d) params.set('date_of_visit', d);
  const doctorKey = String(doctorId ?? '').trim();
  if (doctorKey) params.set('doctor_id', doctorKey);
  params.set('page', String(page));
  params.set('page_size', String(pageSize));
  params.set('sort', String(sort).trim().toLowerCase() === 'desc' ? 'desc' : 'asc');
  return params.toString();
}

export const RESERVATION_SORT_ASC = 'asc';
export const RESERVATION_SORT_DESC = 'desc';

export const RESERVATION_SORT_OPTIONS = [
  { value: RESERVATION_SORT_ASC, label: 'Ascending' },
  { value: RESERVATION_SORT_DESC, label: 'Descending' },
];

function truthyFlag(value) {
  if (value === true || value === 1) return true;
  const s = String(value ?? '').trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
}

/** GET /reservations list row — patient has unpaid invoice(s) from prior visits. */
export function reservationMustPay(row) {
  if (!row || typeof row !== 'object') return false;
  if (truthyFlag(row.must_pay ?? row.mustPay)) return true;
  const patient = row.patient;
  if (patient && typeof patient === 'object') {
    if (truthyFlag(patient.must_pay ?? patient.mustPay)) return true;
  }
  return false;
}

export function reservationPatientDisplayName(row) {
  if (!row || typeof row !== 'object') return '—';
  const n = row.patient_name ?? row.patientName;
  if (n != null && String(n).trim()) return String(n).trim();
  const a = String(row.first_name ?? '').trim();
  const b = String(row.last_name ?? '').trim();
  if (a || b) return [a, b].filter(Boolean).join(' ');
  return row.patient_id != null ? `Patient #${row.patient_id}` : '—';
}

/** Mobile number for invoices search filter. */
export function reservationPatientMobile(row) {
  if (!row || typeof row !== 'object') return '';
  const raw =
    row.patient_mobile ??
    row.patientMobile ??
    row.patient?.mobile ??
    row.mobile ??
    row.phone ??
    '';
  return String(raw).trim();
}

/** Search string for invoices list — patient mobile. */
export function reservationPatientInvoiceSearch(row) {
  return reservationPatientMobile(row);
}

export const RESERVATION_MUST_PAY_TOOLTIP =
  'This patient has unpaid invoices from previous appointments.';

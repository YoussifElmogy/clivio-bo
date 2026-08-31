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

/** Reservation id from create/book response (supports wrapped payloads). */
export function unwrapReservationId(raw) {
  const row = unwrapReservationDetail(raw);
  const id = row?.id ?? (raw && typeof raw === 'object' ? raw.id : null);
  if (id == null || id === '') return null;
  const n = Number(id);
  return Number.isFinite(n) ? n : id;
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

/** Quick status update from appointments list. */
export function buildReservationStatusPatchPayload(status) {
  const normalized = String(status ?? '').trim().toLowerCase();
  return { status: STATUS_SET.has(normalized) ? normalized : RESERVATION_STATUS.PENDING };
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

import { generalServiceDefaultValues } from '../schemas/generalServiceSchema';
import { formatMoneyAmount } from '../utils/formatMoney';

/** Page size when loading services for dropdowns (appointment summary, etc.). */
export const GENERAL_SERVICES_CATALOG_PAGE_SIZE = 200;

export function generalServicesListUrl(doctorId, { page = 1, pageSize = GENERAL_SERVICES_CATALOG_PAGE_SIZE } = {}) {
  const params = new URLSearchParams({
    doctor_id: String(doctorId),
    page: String(page),
    page_size: String(pageSize),
  });
  return `/general-services?${params.toString()}`;
}

export function formatGeneralServicePrice(value) {
  return formatMoneyAmount(value) ?? '';
}

function formatOptionalMoneyForApi(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toFixed(2);
}

function parseOptionalMoneyFromApi(value) {
  if (value === '' || value == null) return '';
  const n = Number(value);
  return Number.isFinite(n) ? n : '';
}

function unwrapGeneralServiceRow(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.general_service && typeof data.general_service === 'object') return data.general_service;
  if (
    data.data &&
    typeof data.data === 'object' &&
    (data.data.id != null || data.data.name != null || data.data.price != null)
  ) {
    return data.data;
  }
  if (data.id != null || data.name != null || data.price != null || data.clinic_fees != null) return data;
  return data;
}

export function mergeGeneralServiceFromApi(data) {
  const row = unwrapGeneralServiceRow(data);
  if (!row || typeof row !== 'object') return { ...generalServiceDefaultValues };

  const doctorRaw = row.doctor ?? row.doctor_id ?? row.doctor?.id;
  const doctor =
    doctorRaw !== '' && doctorRaw != null && !Number.isNaN(Number(doctorRaw)) ? Number(doctorRaw) : '';

  const clinicFeesRaw = row.clinic_fees ?? row.clinicFees;
  const clinicFees = parseOptionalMoneyFromApi(clinicFeesRaw);

  return {
    doctor,
    name: typeof row.name === 'string' ? row.name : '',
    clinicFees,
  };
}

/** Normalize list row for UI selects. */
export function mapGeneralServiceRow(row) {
  if (!row || typeof row !== 'object') return null;
  const id = row.id ?? row.uuid;
  if (id == null) return null;
  const name = typeof row.name === 'string' ? row.name.trim() : '';
  if (!name) return null;
  const priceRaw = row.price;
  const price =
    priceRaw !== '' && priceRaw != null && !Number.isNaN(Number(priceRaw)) ? Number(priceRaw) : null;
  const clinicFeesRaw = row.clinic_fees ?? row.clinicFees;
  const clinicFees =
    clinicFeesRaw !== '' && clinicFeesRaw != null && !Number.isNaN(Number(clinicFeesRaw))
      ? Number(clinicFeesRaw)
      : null;
  return { id, name, price, clinic_fees: clinicFees };
}

function normalizeGeneralServiceIdsList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(id => Number(id))
    .filter(id => Number.isFinite(id) && id > 0);
}

/** All general service ids from GET /reservation-summary (e.g. `general_service_ids`). */
export function extractGeneralServiceIdsFromSummary(data) {
  if (!data || typeof data !== 'object') return [];

  const fromArray =
    data.general_service_ids ??
    data.reservation?.general_service_ids ??
    data.prescription?.general_service_ids;
  const list = normalizeGeneralServiceIdsList(fromArray);
  if (list.length) return list;

  const single =
    data.reservation?.general_service_id ??
    data.reservation?.general_service?.id ??
    data.general_service_id ??
    data.general_service?.id ??
    data.prescription?.general_service_id;
  if (single === '' || single == null) return [];
  const n = Number(single);
  return Number.isFinite(n) && n > 0 ? [n] : [];
}

/** First id for single-select UI (Type dropdown). */
export function extractGeneralServiceIdFromSummary(data) {
  const ids = extractGeneralServiceIdsFromSummary(data);
  if (ids.length) return String(ids[0]);
  return '';
}

export function buildGeneralServicePayload(values, options = {}) {
  const { includeDoctorId = true, forUpdate = false } = options;

  const payload = {
    ...(includeDoctorId ? { doctor_id: Number(values.doctor) } : {}),
    name: String(values.name ?? '').trim(),
  };

  const clinicFees = formatOptionalMoneyForApi(values.clinicFees);

  if (forUpdate) {
    payload.clinic_fees = clinicFees;
    return payload;
  }

  if (clinicFees != null) payload.clinic_fees = clinicFees;

  return payload;
}

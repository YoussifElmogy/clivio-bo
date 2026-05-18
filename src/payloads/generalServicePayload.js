import { generalServiceDefaultValues } from '../schemas/generalServiceSchema';

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
  if (value == null || value === '') return '';
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPriceForApi(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toFixed(2);
}

export function mergeGeneralServiceFromApi(data) {
  const row =
    data && typeof data === 'object' && data.general_service && typeof data.general_service === 'object'
      ? data.general_service
      : data;
  if (!row || typeof row !== 'object') return { ...generalServiceDefaultValues };

  const doctorRaw = row.doctor ?? row.doctor_id ?? row.doctor?.id;
  const doctor =
    doctorRaw !== '' && doctorRaw != null && !Number.isNaN(Number(doctorRaw)) ? Number(doctorRaw) : '';

  const priceRaw = row.price;
  const price =
    priceRaw !== '' && priceRaw != null && !Number.isNaN(Number(priceRaw)) ? Number(priceRaw) : '';

  return {
    doctor,
    name: typeof row.name === 'string' ? row.name : '',
    price,
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
  return { id, name, price };
}

export function extractGeneralServiceIdFromSummary(data) {
  if (!data || typeof data !== 'object') return '';
  const raw =
    data.reservation?.general_service_id ??
    data.reservation?.general_service?.id ??
    data.general_service_id ??
    data.general_service?.id;
  if (raw === '' || raw == null) return '';
  return String(raw);
}

export function buildGeneralServicePayload(values, options = {}) {
  const { includeDoctorId = true } = options;
  const price = formatPriceForApi(values.price);
  if (price == null) throw new Error('Invalid price');

  return {
    ...(includeDoctorId ? { doctor_id: Number(values.doctor) } : {}),
    name: String(values.name ?? '').trim(),
    price,
  };
}

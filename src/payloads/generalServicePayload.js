import { generalServiceDefaultValues } from '../schemas/generalServiceSchema';
import { isTenantPaymentInfoEnabled } from '../config/tenantFeatures';
import { formatMoneyAmount } from '../utils/formatMoney';
import { parsePaginatedList } from '../utils/parsePaginatedList';

export function generalServicesListUrl(doctorId, { page = 1, pageSize = 10 } = {}) {
  const params = new URLSearchParams({
    doctor_id: String(doctorId),
    page: String(page),
    page_size: String(pageSize),
  });
  return `/general-services?${params.toString()}`;
}

/** Single request — all services for dropdowns. Requires backend `all=true` (see team note below). */
export function generalServicesCatalogUrl(doctorId) {
  const params = new URLSearchParams({
    doctor_id: String(doctorId),
    all: 'true',
  });
  return `/general-services?${params.toString()}`;
}

/** Load all general services for a doctor in one API call. */
export async function fetchAllGeneralServices(get, doctorId) {
  if (!doctorId) return [];
  const data = await get(generalServicesCatalogUrl(doctorId));
  const parsed = parsePaginatedList(data, { listKeys: ['general_services', 'results'] });
  return parsed.rows.map(mapGeneralServiceRow).filter(Boolean);
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

function parseSummaryServicePrice(data) {
  const raw =
    data?.reservation?.general_service_price ??
    data?.general_service_price ??
    data?.prescription?.general_service_price ??
    '';
  if (raw === '' || raw == null || Number.isNaN(Number(raw))) return '';
  return Number(raw);
}

/**
 * General services saved on a reservation summary (supports multi-service + per-line price).
 * @returns {Array<{ general_service_id: number, price: number|string, name: string }>}
 */
export function extractGeneralServicesFromSummary(data) {
  if (!data || typeof data !== 'object') return [];

  const fromServices =
    data.general_services ??
    data.reservation?.general_services ??
    data.prescription?.general_services;
  if (Array.isArray(fromServices) && fromServices.length) {
    return fromServices
      .map(row => {
        const general_service_id = Number(row?.general_service_id ?? row?.id);
        if (!Number.isFinite(general_service_id) || general_service_id <= 0) return null;
        const priceRaw = row?.price ?? row?.general_service_price;
        const price =
          priceRaw !== '' && priceRaw != null && !Number.isNaN(Number(priceRaw)) ? Number(priceRaw) : '';
        const name = typeof row?.name === 'string' ? row.name.trim() : '';
        return { general_service_id, price, name };
      })
      .filter(Boolean);
  }

  const ids = extractGeneralServiceIdsFromSummary(data);
  const singlePrice = parseSummaryServicePrice(data);
  return ids.map((general_service_id, index) => ({
    general_service_id,
    price: index === 0 && singlePrice !== '' ? singlePrice : '',
    name: '',
  }));
}

/**
 * UI rows → API `general_services` for prescription / pricing endpoints.
 * @param {Array<{ general_service_id?: number, serviceId?: number, price?: number|string }>} rows
 */
export function buildGeneralServicesApiPayload(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map(row => {
      const general_service_id = Number(row?.general_service_id ?? row?.serviceId ?? row?.id);
      const priceRaw = row?.price;
      if (!Number.isFinite(general_service_id) || general_service_id <= 0) return null;
      if (priceRaw === '' || priceRaw == null || Number.isNaN(Number(priceRaw))) return null;
      return {
        general_service_id,
        price: Number(Number(priceRaw).toFixed(2)),
      };
    })
    .filter(Boolean);
}

export function collectGeneralServiceIdsFromRows(rows) {
  return buildGeneralServicesApiPayload(rows).map(row => row.general_service_id);
}

export function buildGeneralServicePayload(values, options = {}) {
  const { includeDoctorId = true, forUpdate = false } = options;

  const payload = {
    ...(includeDoctorId ? { doctor_id: Number(values.doctor) } : {}),
    name: String(values.name ?? '').trim(),
  };

  if (!isTenantPaymentInfoEnabled()) {
    return payload;
  }

  const clinicFees = formatOptionalMoneyForApi(values.clinicFees);

  if (forUpdate) {
    payload.clinic_fees = clinicFees;
    return payload;
  }

  if (clinicFees != null) payload.clinic_fees = clinicFees;

  return payload;
}

export const GENERAL_SERVICES_BULK_URL = '/general-services/bulk';

export function buildGeneralServiceBulkPayload({ name, clinicFees, doctorIds }) {
  const ids = (Array.isArray(doctorIds) ? doctorIds : [])
    .map(id => Number(id))
    .filter(id => Number.isFinite(id) && id > 0);
  if (!ids.length) {
    const err = new Error('Select at least one doctor.');
    err.validationMessage = 'Select at least one doctor.';
    throw err;
  }

  const trimmedName = String(name ?? '').trim();
  if (!trimmedName) {
    const err = new Error('Name is required.');
    err.validationMessage = 'Name is required.';
    throw err;
  }

  const payload = {
    doctor_ids: ids,
    name: trimmedName,
  };

  if (!isTenantPaymentInfoEnabled()) {
    return payload;
  }

  const clinic_fees = formatOptionalMoneyForApi(clinicFees);
  if (clinic_fees != null) payload.clinic_fees = clinic_fees;

  return payload;
}

/** Assign one service + clinic fees to multiple doctors. */
export async function createGeneralServicesForDoctors(post, { name, clinicFees, doctorIds }) {
  const payload = buildGeneralServiceBulkPayload({ name, clinicFees, doctorIds });
  return post(GENERAL_SERVICES_BULK_URL, payload);
}

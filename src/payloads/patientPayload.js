import { patientDefaultValues } from '../schemas/patientSchema';

const PACKAGE_TYPE_PULSE = 1;
const PACKAGE_TYPE_AREA = 2;

function toPositiveIntId(raw) {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Builds `packages` for patient create/update: `{ type: 1|2, package_id }[]`.
 */
export function buildPatientPackagesFromValues(values) {
  const pulseIds = Array.isArray(values?.pulse_package_ids) ? values.pulse_package_ids : [];
  const areaIds = Array.isArray(values?.area_package_ids) ? values.area_package_ids : [];
  const packages = [];
  for (const raw of pulseIds) {
    const package_id = toPositiveIntId(raw);
    if (package_id != null) packages.push({ type: PACKAGE_TYPE_PULSE, package_id });
  }
  for (const raw of areaIds) {
    const package_id = toPositiveIntId(raw);
    if (package_id != null) packages.push({ type: PACKAGE_TYPE_AREA, package_id });
  }
  return packages;
}

function mergePackagesFromApiRow(row) {
  const raw = row?.packages;
  if (!Array.isArray(raw)) {
    return { pulse_package_ids: [], area_package_ids: [] };
  }
  const pulse_package_ids = [];
  const area_package_ids = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const t = Number(entry.type);
    const package_id = toPositiveIntId(entry.package_id);
    if (package_id == null) continue;
    if (t === PACKAGE_TYPE_PULSE) pulse_package_ids.push(package_id);
    else if (t === PACKAGE_TYPE_AREA) area_package_ids.push(package_id);
  }
  return { pulse_package_ids, area_package_ids };
}
import {
  buildInternationalPhoneWithPlus,
  splitPhoneNumber,
} from '../utils/phoneNumber';

function sliceDateOnly(value) {
  if (value == null) return '';
  const s = String(value).trim();
  return s.length >= 10 ? s.slice(0, 10) : s;
}

/**
 * Maps GET /patients/:id (or `{ patient }`) into form values.
 */
export function mergePatientFromApi(data) {
  const row =
    data && typeof data === 'object' && data.patient && typeof data.patient === 'object'
      ? data.patient
      : data;
  if (!row || typeof row !== 'object') {
    return { ...patientDefaultValues };
  }

  const phoneRaw =
    typeof row.mobile_number === 'string'
      ? row.mobile_number
      : typeof row.phone === 'string'
        ? row.phone
        : '';
  const phoneParts = splitPhoneNumber(phoneRaw);

  const packages = mergePackagesFromApiRow(row);

  return {
    is_for_self: typeof row.is_for_self === 'boolean' ? row.is_for_self : true,
    first_name: typeof row.first_name === 'string' ? row.first_name : '',
    last_name: typeof row.last_name === 'string' ? row.last_name : '',
    mobile_country_code: phoneParts.countryCode,
    mobile_number: phoneParts.nationalNumber,
    date_of_birth: sliceDateOnly(row.date_of_birth),
    medical_notes: typeof row.medical_notes === 'string' ? row.medical_notes : '',
    pulse_package_ids: packages.pulse_package_ids,
    area_package_ids: packages.area_package_ids,
  };
}

/** POST /patients — optional medical_notes when non-empty. */
export function buildPatientCreatePayload(values) {
  const body = {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    mobile_number: buildInternationalPhoneWithPlus(
      values.mobile_country_code,
      values.mobile_number
    ),
    date_of_birth: values.date_of_birth.trim(),
    is_for_self: Boolean(values.is_for_self),
  };
  const notes = (values.medical_notes ?? '').trim();
  if (notes) body.medical_notes = notes;
  const packages = buildPatientPackagesFromValues(values);
  if (packages.length > 0) body.packages = packages;
  return body;
}

/** PATCH /patients/:id — include medical_notes (empty string clears). */
export function buildPatientUpdatePayload(values) {
  return {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    mobile_number: buildInternationalPhoneWithPlus(
      values.mobile_country_code,
      values.mobile_number
    ),
    date_of_birth: values.date_of_birth.trim(),
    medical_notes: (values.medical_notes ?? '').trim(),
    packages: buildPatientPackagesFromValues(values),
  };
}

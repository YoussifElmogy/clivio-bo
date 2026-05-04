import { patientDefaultValues } from '../schemas/patientSchema';
import {
  buildInternationalPhone,
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

  return {
    is_for_self: typeof row.is_for_self === 'boolean' ? row.is_for_self : true,
    first_name: typeof row.first_name === 'string' ? row.first_name : '',
    last_name: typeof row.last_name === 'string' ? row.last_name : '',
    mobile_country_code: phoneParts.countryCode,
    mobile_number: phoneParts.nationalNumber,
    date_of_birth: sliceDateOnly(row.date_of_birth),
    medical_notes: typeof row.medical_notes === 'string' ? row.medical_notes : '',
  };
}

/** POST /patients — optional medical_notes when non-empty. */
export function buildPatientCreatePayload(values) {
  const body = {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    mobile_number: buildInternationalPhone(values.mobile_country_code, values.mobile_number),
    date_of_birth: values.date_of_birth.trim(),
    is_for_self: Boolean(values.is_for_self),
  };
  const notes = (values.medical_notes ?? '').trim();
  if (notes) body.medical_notes = notes;
  return body;
}

/** PATCH /patients/:id — include medical_notes (empty string clears). */
export function buildPatientUpdatePayload(values) {
  return {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    mobile_number: buildInternationalPhone(values.mobile_country_code, values.mobile_number),
    date_of_birth: values.date_of_birth.trim(),
    medical_notes: (values.medical_notes ?? '').trim(),
  };
}

import { patientDefaultValues } from '../schemas/patientSchema';

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

  return {
    first_name: typeof row.first_name === 'string' ? row.first_name : '',
    last_name: typeof row.last_name === 'string' ? row.last_name : '',
    mobile_number:
      typeof row.mobile_number === 'string'
        ? row.mobile_number
        : typeof row.phone === 'string'
          ? row.phone
          : '',
    date_of_birth: sliceDateOnly(row.date_of_birth),
    medical_notes: typeof row.medical_notes === 'string' ? row.medical_notes : '',
  };
}

/** POST /patients — optional medical_notes when non-empty. */
export function buildPatientCreatePayload(values) {
  const body = {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    mobile_number: values.mobile_number.trim(),
    date_of_birth: values.date_of_birth.trim(),
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
    mobile_number: values.mobile_number.trim(),
    date_of_birth: values.date_of_birth.trim(),
    medical_notes: (values.medical_notes ?? '').trim(),
  };
}

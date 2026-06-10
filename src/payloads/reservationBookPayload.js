import { normalizeReservationSlot } from './reservationPayload';
import {
  buildInternationalPhoneWithPlus,
  normalizeNationalForCountry,
  validatePhoneByCountry,
} from '../utils/phoneNumber';
import { DEFAULT_COUNTRY_CODE } from '../constants/countryPhoneOptions';

export const RESERVATION_BOOK_URL = '/reservations/book';
export const RESERVATIONS_CREATE_URL = '/reservations';

export function buildReservationCreatePayload({
  patientId,
  branchId,
  doctorId,
  dateOfVisit,
  slot,
}) {
  const pid = Number(patientId);
  const branch_id = Number(branchId);
  const doctor_id = Number(doctorId);
  const date_of_visit = String(dateOfVisit ?? '').trim();
  const slotValue = normalizeReservationSlot(slot);

  if (!Number.isFinite(pid) || pid <= 0) {
    const err = new Error('Select a patient.');
    err.validationMessage = 'Select a patient.';
    throw err;
  }
  if (!Number.isFinite(branch_id) || branch_id <= 0) {
    const err = new Error('Branch is required.');
    err.validationMessage = 'Branch is required.';
    throw err;
  }
  if (!Number.isFinite(doctor_id) || doctor_id <= 0) {
    const err = new Error('Doctor is required.');
    err.validationMessage = 'Doctor is required.';
    throw err;
  }
  if (!date_of_visit) {
    const err = new Error('Visit date is required.');
    err.validationMessage = 'Visit date is required.';
    throw err;
  }
  if (!slotValue) {
    const err = new Error('Time slot is required.');
    err.validationMessage = 'Time slot is required.';
    throw err;
  }

  return {
    patient_id: pid,
    branch_id,
    doctor_id,
    date_of_visit,
    slot: slotValue,
    is_for_self: true,
  };
}

export function buildReservationBookNewPatientPayload({
  firstName,
  lastName,
  mobileCountryCode,
  mobileNumber,
  dateOfBirth,
  medicalNotes,
  branchId,
  doctorId,
  dateOfVisit,
  slot,
}) {
  const first_name = String(firstName ?? '').trim();
  const last_name = String(lastName ?? '').trim();
  const cc = mobileCountryCode || DEFAULT_COUNTRY_CODE;
  const national = normalizeNationalForCountry(cc, mobileNumber);
  const date_of_birth = String(dateOfBirth ?? '').trim();
  const branch_id = Number(branchId);
  const doctor_id = Number(doctorId);
  const date_of_visit = String(dateOfVisit ?? '').trim();
  const slotValue = normalizeReservationSlot(slot);

  if (!first_name) {
    const err = new Error('First name is required.');
    err.validationMessage = 'First name is required.';
    throw err;
  }
  if (!last_name) {
    const err = new Error('Last name is required.');
    err.validationMessage = 'Last name is required.';
    throw err;
  }
  if (!national) {
    const err = new Error('Mobile number is required.');
    err.validationMessage = 'Mobile number is required.';
    throw err;
  }
  const phoneValidation = validatePhoneByCountry(cc, mobileNumber);
  if (phoneValidation) {
    const err = new Error(phoneValidation);
    err.validationMessage = phoneValidation;
    throw err;
  }
  const mobile_number = buildInternationalPhoneWithPlus(cc, mobileNumber);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date_of_birth)) {
    const err = new Error('Date of birth is required.');
    err.validationMessage = 'Date of birth is required.';
    throw err;
  }
  if (!Number.isFinite(branch_id) || branch_id <= 0) {
    const err = new Error('Branch is required.');
    err.validationMessage = 'Branch is required.';
    throw err;
  }
  if (!Number.isFinite(doctor_id) || doctor_id <= 0) {
    const err = new Error('Doctor is required.');
    err.validationMessage = 'Doctor is required.';
    throw err;
  }
  if (!date_of_visit) {
    const err = new Error('Visit date is required.');
    err.validationMessage = 'Visit date is required.';
    throw err;
  }
  if (!slotValue) {
    const err = new Error('Time slot is required.');
    err.validationMessage = 'Time slot is required.';
    throw err;
  }

  const body = {
    first_name,
    last_name,
    mobile_number,
    date_of_birth,
    is_for_self: true,
    branch_id,
    doctor_id,
    date_of_visit,
    slot: slotValue,
  };

  const notes = String(medicalNotes ?? '').trim();
  if (notes) body.medical_notes = notes;

  return body;
}

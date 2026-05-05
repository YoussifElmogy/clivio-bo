import * as yup from 'yup';
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY_CODE } from '../constants/countryPhoneOptions';
import { validatePhoneByCountry } from '../utils/phoneNumber';

const dobRegex = /^\d{4}-\d{2}-\d{2}$/;

export const patientDefaultValues = {
  is_for_self: true,
  first_name: '',
  last_name: '',
  mobile_country_code: DEFAULT_COUNTRY_CODE,
  mobile_number: '',
  date_of_birth: '',
  medical_notes: '',
  /** Numeric ids for POST/PATCH `packages` with type 1 (pulse). */
  pulse_package_ids: [],
  /** Numeric ids for POST/PATCH `packages` with type 2 (area). */
  area_package_ids: [],
};

export const patientSchema = yup.object({
  is_for_self: yup.boolean().oneOf([true, false]).required(),
  first_name: yup.string().trim().required('First name is required'),
  last_name: yup.string().trim().required('Last name is required'),
  mobile_country_code: yup
    .string()
    .oneOf(COUNTRY_OPTIONS.map(x => x.code), 'Select a valid country code')
    .required('Country code is required'),
  mobile_number: yup
    .string()
    .required('Mobile number is required')
    .test('mobile-by-country', function (value) {
      const message = validatePhoneByCountry(this.parent?.mobile_country_code, value);
      return message ? this.createError({ message }) : true;
    }),
  date_of_birth: yup
    .string()
    .trim()
    .required('Date of birth is required')
    .matches(dobRegex, 'Use YYYY-MM-DD'),
  medical_notes: yup.string().trim().max(20000, 'Notes are too long').optional(),
  pulse_package_ids: yup
    .array()
    .of(yup.number().integer().positive('Invalid package id'))
    .optional()
    .default([]),
  area_package_ids: yup
    .array()
    .of(yup.number().integer().positive('Invalid package id'))
    .optional()
    .default([]),
});

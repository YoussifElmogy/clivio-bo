import * as yup from 'yup';
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY_CODE } from '../constants/countryPhoneOptions';
import { validatePhoneByCountry } from '../utils/phoneNumber';

/** Backend enum: 0 = Saturday … 6 = Friday */
export const VACATION_DAY_OPTIONS = [
  { value: 0, label: 'Saturday' },
  { value: 1, label: 'Sunday' },
  { value: 2, label: 'Monday' },
  { value: 3, label: 'Tuesday' },
  { value: 4, label: 'Wednesday' },
  { value: 5, label: 'Thursday' },
  { value: 6, label: 'Friday' },
];

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const branchDefaultValues = {
  name: '',
  phone_country_code: DEFAULT_COUNTRY_CODE,
  phone: '',
  address: '',
  active: true,
  from_time: '09:00',
  to_time: '17:00',
  vacation_days: [],
};

export const branchSchema = yup.object({
  name: yup.string().trim().required('Name is required'),
  phone_country_code: yup
    .string()
    .oneOf(COUNTRY_OPTIONS.map(x => x.code), 'Select a valid country code')
    .required('Country code is required'),
  phone: yup
    .string()
    .required('Phone is required')
    .test('phone-by-country', function (value) {
      const message = validatePhoneByCountry(this.parent?.phone_country_code, value);
      return message ? this.createError({ message }) : true;
    }),
  address: yup.string().trim().required('Address is required'),
  active: yup.boolean(),
  from_time: yup
    .string()
    .required('From time is required')
    .matches(timeRegex, 'Use a valid time (HH:mm)')
    .test('before-to', 'Start time must be before end time', function (from) {
      const { to_time: to } = this.parent;
      if (!from || !to || !timeRegex.test(from) || !timeRegex.test(to)) return true;
      return from < to;
    }),
  to_time: yup.string().required('To time is required').matches(timeRegex, 'Use a valid time (HH:mm)'),
  vacation_days: yup
    .array()
    .of(yup.number().integer().min(0).max(6))
    .default([]),
});

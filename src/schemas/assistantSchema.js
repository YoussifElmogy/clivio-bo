import * as yup from 'yup';
import { optionalUserPasswordYup, requiredUserPasswordYup } from './userPasswordSchema';
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY_CODE } from '../constants/countryPhoneOptions';
import { validatePhoneByCountry } from '../utils/phoneNumber';

export const assistantCreateDefaultValues = {
  name: '',
  email: '',
  phone_country_code: DEFAULT_COUNTRY_CODE,
  phone: '',
  branch_ids: [],
  password: '',
  role_ids: [],
};

export function createAssistantSchema({ requirePassword = false } = {}) {
  return yup.object({
    name: yup.string().trim().required('Name is required'),
    email: yup.string().trim().email('Valid email required').required('Email is required'),
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
    branch_ids: yup
      .array()
      .of(yup.number())
      .min(1, 'Select at least one branch'),
    password: requirePassword ? requiredUserPasswordYup() : optionalUserPasswordYup(),
    role_ids: yup
      .array()
      .of(yup.number())
      .min(1, 'Select at least one permission'),
  });
}

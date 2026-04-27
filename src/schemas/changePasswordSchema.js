import * as yup from 'yup';
import { requiredUserPasswordYup } from './userPasswordSchema';

export const changePasswordFormDefaultValues = {
  password: '',
  confirm_password: '',
};

export const changePasswordFormSchema = yup.object({
  password: requiredUserPasswordYup('New password is required'),
  confirm_password: yup
    .string()
    .transform(v => (typeof v === 'string' ? v.trim() : ''))
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

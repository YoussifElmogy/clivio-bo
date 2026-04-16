import * as yup from 'yup';

export const loginDefaultValues = {
  username: '',
  password: '',
};

export const loginSchema = yup.object({
  username: yup
    .string()
    .trim()
    .required('Please enter your username'),
  password: yup
    .string()
    .required('Please enter your password')
    .min(6, 'Password must be at least 6 characters'),
});

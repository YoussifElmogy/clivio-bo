import * as yup from 'yup';

export const USER_PASSWORD_MIN_LENGTH = 8;

/** Required initial password (e.g. super admin creating staff). */
export function requiredUserPasswordYup(message = 'Password is required') {
  return yup
    .string()
    .transform(v => (typeof v === 'string' ? v.trim() : ''))
    .required(message)
    .min(
      USER_PASSWORD_MIN_LENGTH,
      `Password must be at least ${USER_PASSWORD_MIN_LENGTH} characters`
    );
}

/** Optional field; if non-empty, must meet minimum length. */
export function optionalUserPasswordYup() {
  return yup
    .string()
    .transform(v => (typeof v === 'string' ? v.trim() : ''))
    .test(
      'password-length',
      `Password must be at least ${USER_PASSWORD_MIN_LENGTH} characters`,
      v => v === '' || v.length >= USER_PASSWORD_MIN_LENGTH
    );
}

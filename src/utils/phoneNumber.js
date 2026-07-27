import { parsePhoneNumberFromString } from 'libphonenumber-js';
import {
  COUNTRY_OPTIONS,
  DEFAULT_COUNTRY_CODE,
} from '../constants/countryPhoneOptions';

const EGYPT_COUNTRY_CODE = '+20';
const GENERIC_NATIONAL_MAX = 15;

function digitsOnly(value) {
  return String(value ?? '').replace(/\D+/g, '');
}

/** Strip a local leading 0 when API/store sends Egyptian numbers as 01xxxxxxxxx. */
export function normalizeNationalForCountry(countryCode, value) {
  const cc = normalizeCountryCode(countryCode);
  let national = digitsOnly(value);
  if (cc === EGYPT_COUNTRY_CODE && national.startsWith('0') && national.length === 11) {
    national = national.slice(1);
  }
  return national;
}

export function egyptMobileExample() {
  return '1099036435';
}

function validateEgyptMobile(national) {
  if (!national) return 'Mobile number is required';
  if (national.startsWith('0')) {
    return `Do not start with 0. Use ${EGYPT_COUNTRY_CODE} ${egyptMobileExample()}`;
  }
  if (national.length !== 10) {
    return national.length < 10
      ? 'Mobile number must be exactly 10 digits'
      : 'Mobile number must be exactly 10 digits (no extra digits)';
  }
  if (!/^1\d{9}$/.test(national)) {
    return `Enter a valid Egyptian mobile number (e.g. ${egyptMobileExample()})`;
  }
  return null;
}

export function normalizeCountryCode(code) {
  const raw = String(code ?? '').trim();
  if (!raw) return DEFAULT_COUNTRY_CODE;
  return COUNTRY_OPTIONS.some(x => x.code === raw) ? raw : DEFAULT_COUNTRY_CODE;
}

export function normalizeNationalNumber(value) {
  return digitsOnly(value);
}

export function splitPhoneNumber(rawPhone) {
  const raw = String(rawPhone ?? '').trim();
  if (!raw) {
    return { countryCode: DEFAULT_COUNTRY_CODE, nationalNumber: '' };
  }

  const parsed = parsePhoneNumberFromString(raw.startsWith('+') ? raw : `+${raw.replace(/^\+/, '')}`);
  if (parsed?.country && parsed.countryCallingCode) {
    const code = `+${parsed.countryCallingCode}`;
    if (COUNTRY_OPTIONS.some(x => x.code === code)) {
      return {
        countryCode: code,
        nationalNumber: normalizeNationalForCountry(code, parsed.nationalNumber),
      };
    }
  }

  const compact = raw.replace(/[^\d+]/g, '');
  const compactDigits = digitsOnly(raw);
  const option = [...COUNTRY_OPTIONS]
    .sort((a, b) => b.code.length - a.code.length)
    .find(x => {
      const codeDigits = x.code.replace(/^\+/, '');
      return compact.startsWith(x.code) || compactDigits.startsWith(codeDigits);
    });

  if (option) {
    const codeDigits = option.code.replace(/^\+/, '');
    const national = compact.startsWith(option.code)
      ? compact.slice(option.code.length)
      : compactDigits.slice(codeDigits.length);
    return {
      countryCode: option.code,
      nationalNumber: normalizeNationalForCountry(option.code, national),
    };
  }

  return {
    countryCode: DEFAULT_COUNTRY_CODE,
    nationalNumber: normalizeNationalForCountry(DEFAULT_COUNTRY_CODE, compact),
  };
}

export function buildInternationalPhone(countryCode, nationalNumber) {
  const cc = normalizeCountryCode(countryCode);
  const national = normalizeNationalForCountry(cc, nationalNumber);
  if (!national) return '';
  return `${cc}${national}`.replace(/^\+/, '');
}

/** Same as buildInternationalPhone but keeps the leading `+` (e.g. patient API). */
export function buildInternationalPhoneWithPlus(countryCode, nationalNumber) {
  const cc = normalizeCountryCode(countryCode);
  const national = normalizeNationalForCountry(cc, nationalNumber);
  if (!national) return '';
  return `${cc}${national}`;
}

export function validatePhoneByCountry(countryCode, nationalNumber) {
  const cc = normalizeCountryCode(countryCode);
  const rawNational = digitsOnly(nationalNumber);
  if (!rawNational) return 'Phone number is required';

  if (cc === EGYPT_COUNTRY_CODE) {
    return validateEgyptMobile(rawNational);
  }

  return null;
}

export function nationalPhonePlaceholder(countryCode) {
  const cc = normalizeCountryCode(countryCode);
  if (cc === EGYPT_COUNTRY_CODE) return egyptMobileExample();
  return 'Phone number';
}

export function nationalPhoneMaxLength() {
  return GENERIC_NATIONAL_MAX;
}

/** Normalize digits while typing — Egypt cannot start with 0. */
export function sanitizeNationalPhoneInput(countryCode, value) {
  const cc = normalizeCountryCode(countryCode);
  let digits = digitsOnly(value);
  if (cc === EGYPT_COUNTRY_CODE) {
    digits = digits.replace(/^0+/, '');
  }
  return digits.slice(0, GENERIC_NATIONAL_MAX);
}

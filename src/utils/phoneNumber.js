import { COUNTRY_OPTIONS, DEFAULT_COUNTRY_CODE } from '../constants/countryPhoneOptions';

const EGYPT_COUNTRY_CODE = '+20';

function digitsOnly(value) {
  return String(value ?? '').replace(/\D+/g, '');
}

function countryOption(countryCode) {
  const cc = normalizeCountryCode(countryCode);
  return COUNTRY_OPTIONS.find(x => x.code === cc) ?? null;
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
  if (cc === EGYPT_COUNTRY_CODE) {
    return validateEgyptMobile(rawNational);
  }
  const national = normalizeNationalForCountry(cc, nationalNumber);
  if (!national) return 'Phone number is required';
  const option = countryOption(cc);
  if (!option) return 'Select a valid country code';
  if (national.length !== option.nationalLength) {
    return national.length < option.nationalLength
      ? `Phone must be exactly ${option.nationalLength} digits for ${option.label}`
      : `Phone must be exactly ${option.nationalLength} digits for ${option.label} (no extra digits)`;
  }
  return null;
}

export function nationalPhonePlaceholder(countryCode) {
  const cc = normalizeCountryCode(countryCode);
  if (cc === EGYPT_COUNTRY_CODE) return egyptMobileExample();
  const option = countryOption(cc);
  if (!option) return '100 111 2233';
  return '1'.repeat(Math.min(option.nationalLength, 3)) + '0'.repeat(Math.max(0, option.nationalLength - 3));
}

export function nationalPhoneMaxLength(countryCode) {
  const option = countryOption(countryCode);
  return option?.nationalLength ?? 15;
}

/** Normalize digits while typing — Egypt cannot start with 0. */
export function sanitizeNationalPhoneInput(countryCode, value) {
  const cc = normalizeCountryCode(countryCode);
  let digits = digitsOnly(value);
  if (cc === EGYPT_COUNTRY_CODE) {
    digits = digits.replace(/^0+/, '');
  }
  return digits.slice(0, nationalPhoneMaxLength(cc));
}


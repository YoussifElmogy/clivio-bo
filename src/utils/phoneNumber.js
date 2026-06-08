import { COUNTRY_OPTIONS, DEFAULT_COUNTRY_CODE } from '../constants/countryPhoneOptions';

function digitsOnly(value) {
  return String(value ?? '').replace(/\D+/g, '');
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
      nationalNumber: normalizeNationalNumber(national),
    };
  }

  return {
    countryCode: DEFAULT_COUNTRY_CODE,
    nationalNumber: normalizeNationalNumber(compact),
  };
}

export function buildInternationalPhone(countryCode, nationalNumber) {
  const cc = normalizeCountryCode(countryCode);
  const national = normalizeNationalNumber(nationalNumber);
  if (!national) return '';
  return `${cc}${national}`.replace(/^\+/, '');
}

export function validatePhoneByCountry(countryCode, nationalNumber) {
  const cc = normalizeCountryCode(countryCode);
  const national = normalizeNationalNumber(nationalNumber);
  if (!national) return 'Phone number is required';
  const option = COUNTRY_OPTIONS.find(x => x.code === cc);
  if (!option) return 'Select a valid country code';
  if (national.length !== option.nationalLength) {
    return `Phone must be ${option.nationalLength} digits for ${option.label}`;
  }
  return null;
}


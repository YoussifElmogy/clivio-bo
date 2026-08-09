import Cookies from 'js-cookie';

export const TENANT_API_BASE_URL_KEY = 'tenantApiBaseUrl';
export const TENANT_FEATURE_FLAGS_KEY = 'tenantFeatureFlags';
export const TENANT_CLINIC_ID_KEY = 'tenantClinicId';

export function readTenantApiBaseUrl() {
  const raw = Cookies.get(TENANT_API_BASE_URL_KEY);
  return raw != null ? String(raw).trim() : '';
}

export function writeTenantApiBaseUrl(baseUrl) {
  const value = String(baseUrl ?? '').trim();
  if (!value) {
    Cookies.remove(TENANT_API_BASE_URL_KEY);
    return;
  }
  Cookies.set(TENANT_API_BASE_URL_KEY, value, { expires: 7, sameSite: 'lax' });
}

export function readTenantFeatureFlagsRaw() {
  try {
    const raw = Cookies.get(TENANT_FEATURE_FLAGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeTenantFeatureFlagsRaw(flags) {
  if (flags == null) {
    Cookies.remove(TENANT_FEATURE_FLAGS_KEY);
    return;
  }
  Cookies.set(TENANT_FEATURE_FLAGS_KEY, JSON.stringify(flags), {
    expires: 7,
    sameSite: 'lax',
  });
}

export function readTenantClinicId() {
  const raw = Cookies.get(TENANT_CLINIC_ID_KEY);
  return raw != null ? String(raw).trim() : '';
}

export function writeTenantClinicId(clinicId) {
  const value =
    clinicId != null && String(clinicId).trim() !== '' ? String(clinicId).trim() : '';
  if (!value) {
    Cookies.remove(TENANT_CLINIC_ID_KEY);
    return;
  }
  Cookies.set(TENANT_CLINIC_ID_KEY, value, { expires: 7, sameSite: 'lax' });
}

export function clearTenantStorage() {
  Cookies.remove(TENANT_API_BASE_URL_KEY);
  Cookies.remove(TENANT_FEATURE_FLAGS_KEY);
  Cookies.remove(TENANT_CLINIC_ID_KEY);
}

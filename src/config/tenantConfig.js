import {
  clearTenantStorage,
  readTenantApiBaseUrl,
  readTenantClinicId,
  writeTenantApiBaseUrl,
  writeTenantClinicId,
} from './tenantStorage';
import {
  resetRuntimeFeatureFlags,
  restoreFeatureFlagsFromStorage,
  setRuntimeFeatureFlags,
} from './featureFlags';
import { setApiBaseUrl, getEnvFallbackApiBaseUrl } from '../configs/apiClient';

/** Apply resolved tenant config (after lookup or when restoring session). */
export function applyTenantConfig({ baseUrl, featureFlagsRaw, clinicId }) {
  if (baseUrl) {
    setApiBaseUrl(baseUrl);
    writeTenantApiBaseUrl(baseUrl);
  }
  if (featureFlagsRaw != null) {
    setRuntimeFeatureFlags(featureFlagsRaw);
  }
  if (clinicId != null && String(clinicId).trim() !== '') {
    writeTenantClinicId(clinicId);
  }
}

/** Clinic id from tenant lookup (for create payloads). */
export function getTenantClinicId() {
  const stored = readTenantClinicId();
  if (!stored) return null;
  const n = Number(stored);
  if (Number.isInteger(n) && n > 0) return n;
  return stored;
}

/** Adds `clinic_id` when resolved from tenant lookup. */
export function withTenantClinicId(payload) {
  const clinicId = getTenantClinicId();
  if (clinicId == null) return payload;
  return { ...payload, clinic_id: clinicId };
}

/** Restore tenant API URL + flags from cookies (sync, on app boot). */
export function restoreTenantConfigFromStorage() {
  const storedBase = readTenantApiBaseUrl();
  if (storedBase) {
    setApiBaseUrl(storedBase);
  } else {
    setApiBaseUrl(getEnvFallbackApiBaseUrl());
  }
  return restoreFeatureFlagsFromStorage();
}

export function clearTenantConfig() {
  clearTenantStorage();
  resetRuntimeFeatureFlags();
  setApiBaseUrl(getEnvFallbackApiBaseUrl());
}

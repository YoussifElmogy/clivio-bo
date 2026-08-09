import axios from 'axios';
import { hasLookupFeatureKeys, normalizeFeatureFlags } from './featureFlags';

function normalizeBaseUrl(value) {
  return String(value ?? '')
    .trim()
    .replace(/\/$/, '');
}

function readMasterUrl() {
  const raw =
    import.meta.env.VITE_MASTER_URL ??
    import.meta.env.VITE_LOOKUP_URL ??
    '';
  return normalizeBaseUrl(raw);
}

function parseClinicId(raw) {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (Number.isInteger(n) && n > 0) return n;
  const s = String(raw).trim();
  return s || null;
}

/** FastAPI-style `detail` (string, object, or validation array). */
export function readApiDetail(data) {
  if (data == null || typeof data !== 'object') return null;

  const detail =
    /** @type {Record<string, unknown>} */ (data).detail ??
    /** @type {Record<string, unknown>} */ (data).message ??
    /** @type {Record<string, unknown>} */ (data).error;

  if (typeof detail === 'string' && detail.trim()) return detail.trim();

  if (Array.isArray(detail)) {
    const parts = detail
      .map(item => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object' && typeof item.msg === 'string') {
          return item.msg.trim();
        }
        return '';
      })
      .filter(Boolean);
    if (parts.length) return parts.join(', ');
  }

  if (detail && typeof detail === 'object' && typeof detail.msg === 'string') {
    const msg = detail.msg.trim();
    if (msg) return msg;
  }

  return null;
}

function throwTenantLookupError(err, fallback = 'Tenant lookup failed.') {
  const detail = readApiDetail(err?.response?.data);
  const lookupErr = new Error(detail || err?.message || fallback);
  lookupErr.code = 'TENANT_LOOKUP_FAILED';
  if (err?.response?.status) lookupErr.status = err.response.status;
  throw lookupErr;
}

function mergeLookupFeatureSources(root) {
  const legacy =
    root.feature_flags ?? root.flags ?? null;
  const modern =
    root.features ?? root.featureFlags ?? null;

  const legacyObj =
    legacy && typeof legacy === 'object' && !Array.isArray(legacy)
      ? /** @type {Record<string, unknown>} */ (legacy)
      : {};
  const modernObj =
    modern && typeof modern === 'object' && !Array.isArray(modern)
      ? /** @type {Record<string, unknown>} */ (modern)
      : {};

  // When backend sends `features`, use it exclusively — ignore legacy `feature_flags`.
  if (hasLookupFeatureKeys(modernObj)) {
    return modernObj;
  }

  return legacyObj;
}

/** @param {unknown} data */
export function normalizeTenantLookupResponse(data) {
  const root =
    data && typeof data === 'object'
      ? /** @type {Record<string, unknown>} */ (data.data ?? data.result ?? data)
      : {};

  const baseUrl = normalizeBaseUrl(
    root.base_url ?? root.baseUrl ?? root.api_base_url ?? root.apiBaseUrl ?? ''
  );
  const featureFlags = mergeLookupFeatureSources(root);
  const clinicId = parseClinicId(
    root.clinic_id ??
      root.clinicId ??
      (root.clinic && typeof root.clinic === 'object'
        ? /** @type {{ id?: unknown }} */ (root.clinic).id
        : null)
  );

  if (!baseUrl) {
    const err = new Error('Tenant lookup did not return a base URL.');
    err.code = 'TENANT_LOOKUP_NO_BASE_URL';
    throw err;
  }

  return {
    baseUrl,
    clinicId,
    featureFlagsRaw: featureFlags,
    featureFlags: normalizeFeatureFlags(featureFlags),
  };
}

/**
 * Resolve tenant API base URL and feature flags before login.
 * GET {VITE_MASTER_URL}/api/lookup?email=<email>
 *
 * @param {string} email
 */
export async function lookupTenantByEmail(email) {
  const trimmed = String(email ?? '').trim();
  if (!trimmed) {
    const err = new Error('Email is required for tenant lookup.');
    err.code = 'TENANT_LOOKUP_NO_EMAIL';
    throw err;
  }

  const masterUrl = readMasterUrl();
  if (!masterUrl) {
    const err = new Error('VITE_MASTER_URL is not configured.');
    err.code = 'TENANT_LOOKUP_NO_MASTER_URL';
    throw err;
  }

  const { data } = await axios
    .get(`${masterUrl}/api/lookup`, {
      params: { email: trimmed },
      headers: { Accept: 'application/json' },
      timeout: 20000,
    })
    .catch(err => {
      throwTenantLookupError(err);
    });

  return normalizeTenantLookupResponse(data);
}

export function isTenantDiscoveryEnabled() {
  return Boolean(readMasterUrl());
}

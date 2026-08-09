import {
  readTenantFeatureFlagsRaw,
  writeTenantFeatureFlagsRaw,
} from './tenantStorage';

function envBool(key, defaultWhenUnset = false) {
  const raw = import.meta.env[key];
  if (raw == null || String(raw).trim() === '') return defaultWhenUnset;
  const v = String(raw).trim().toLowerCase();
  if (v === 'false' || v === '0' || v === 'no') return false;
  return v === 'true' || v === '1' || v === 'yes';
}

function envPositiveInt(key) {
  const raw = import.meta.env[key];
  if (raw == null || String(raw).trim() === '') return null;
  const n = Number(String(raw).trim());
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

function normalizeFlagKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function truthyFlag(value) {
  if (value === true || value === 1) return true;
  const s = String(value ?? '').trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
}

function envTabVisibleFlag(envKey, defaultWhenUnset = true) {
  const raw = import.meta.env[envKey];
  if (raw == null || String(raw).trim() === '') return defaultWhenUnset;
  const v = String(raw).trim().toLowerCase();
  if (v === 'false' || v === '0' || v === 'no') return false;
  return v === 'true' || v === '1' || v === 'yes';
}

/** @typedef {'5k' | '7.5k' | '10k' | 'full'} PackageTier */

/**
 * @typedef {{
 *   face_map: boolean,
 *   body_map_derma: boolean,
 *   inventory: boolean,
 *   laser_package: boolean,
 *   payment_info: boolean,
 *   services: boolean,
 *   appointment_summary?: boolean,
 * }} TenantFeatures
 */

/**
 * @typedef {{
 *   packageTier: PackageTier,
 *   smsPackage: boolean,
 *   branchLimit: number|null,
 *   clinicMode: 'prescription'|'derma'|null,
 *   dermaTabs: {
 *     APPOINTMENT_SUMMARY: boolean,
 *     FACE_MAP: boolean,
 *     BODY_MAP: boolean,
 *     LASER_PACKAGES: boolean,
 *   }|null,
 *   features: TenantFeatures,
 *   featuresFromLookup: boolean,
 *   raw: Record<string, unknown>,
 * }} RuntimeFeatureFlags
 */

const LOOKUP_FEATURE_KEYS = new Set([
  'face_map',
  'body_map',
  'body_map_derma',
  'body_map_nutrition',
  'inventory',
  'laser_package',
  'laser_packages',
  'payment_info',
  'services',
  'appointment_summary',
]);

const BODY_MAP_DERMA_KEYS = new Set(['body_map_derma', 'derma_body_map', 'body_map', 'dermabodymap']);

function packageTierFromEnv() {
  if (envBool('VITE_PACKAGE_10K')) return '10k';
  if (envBool('VITE_PACKAGE_7_5K')) return '7.5k';
  if (envBool('VITE_PACKAGE_5K')) return '5k';
  return 'full';
}

function dermaTabsFromEnv() {
  return {
    APPOINTMENT_SUMMARY: envTabVisibleFlag('VITE_DERMA_APPOINTMENT_SUMMARY_VIEW_ONLY'),
    FACE_MAP: envTabVisibleFlag('VITE_DERMA_FACE_MAP_VIEW_ONLY'),
    BODY_MAP: envTabVisibleFlag('VITE_DERMA_BODY_MAP_VIEW_ONLY'),
    LASER_PACKAGES: envTabVisibleFlag('VITE_DERMA_LASER_PACKAGES_VIEW_ONLY'),
  };
}

function extractFeaturesSource(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const obj = /** @type {Record<string, unknown>} */ (raw);
  if (obj.features && typeof obj.features === 'object' && !Array.isArray(obj.features)) {
    return /** @type {Record<string, unknown>} */ (obj.features);
  }
  return obj;
}

function hasLookupFeatureKeys(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  return Object.keys(/** @type {Record<string, unknown>} */ (obj)).some(key =>
    LOOKUP_FEATURE_KEYS.has(normalizeFlagKey(key))
  );
}

function hasLookupFeaturesObject(raw) {
  const source = extractFeaturesSource(raw);
  if (!source) return false;
  return hasLookupFeatureKeys(source);
}

/** True when any derma body-map key is enabled (`body_map_nutrition` ignored). */
function readBodyMapDermaFeature(source, defaultValue) {
  if (!source || typeof source !== 'object') return defaultValue;

  let sawExplicit = false;
  let anyTrue = false;

  for (const [k, v] of Object.entries(/** @type {Record<string, unknown>} */ (source))) {
    const nk = normalizeFlagKey(k);
    if (nk === 'body_map_nutrition') continue;
    if (!BODY_MAP_DERMA_KEYS.has(nk)) continue;
    if (v === undefined || v === null) continue;
    sawExplicit = true;
    if (truthyFlag(v)) anyTrue = true;
  }

  if (!sawExplicit) return defaultValue;
  return anyTrue;
}

function readFeatureFlag(source, keys, defaultValue) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return truthyFlag(source[key]);
    }
    const normalized = normalizeFlagKey(key);
    for (const [k, v] of Object.entries(source)) {
      if (normalizeFlagKey(k) === normalized && v !== undefined && v !== null) {
        return truthyFlag(v);
      }
    }
  }
  return defaultValue;
}

/** Env / package-tier defaults when lookup `features` is unavailable. */
function buildDefaultTenantFeatures(packageTier) {
  const blocked5k = packageTier === '5k';
  const tabs = dermaTabsFromEnv();
  return {
    face_map: tabs.FACE_MAP,
    body_map_derma: tabs.BODY_MAP,
    inventory: !blocked5k,
    laser_package: !blocked5k && tabs.LASER_PACKAGES,
    payment_info: true,
    services: !blocked5k,
    appointment_summary: tabs.APPOINTMENT_SUMMARY,
  };
}

/** Map lookup `features` to app flags. Ignores `body_map_nutrition`. */
function normalizeTenantFeatures(raw, packageTier) {
  const defaults = buildDefaultTenantFeatures(packageTier);
  const source = extractFeaturesSource(raw);
  if (!source) return { features: defaults, featuresFromLookup: false };

  if (!hasLookupFeaturesObject(raw)) {
    return { features: defaults, featuresFromLookup: false };
  }

  return {
    featuresFromLookup: true,
    features: {
      face_map: readFeatureFlag(source, ['face_map', 'derma_face_map'], defaults.face_map),
      body_map_derma: readBodyMapDermaFeature(source, defaults.body_map_derma),
      inventory: readFeatureFlag(source, ['inventory'], defaults.inventory),
      laser_package: readFeatureFlag(
        source,
        ['laser_package', 'laser_packages', 'derma_laser_packages'],
        defaults.laser_package
      ),
      payment_info: readFeatureFlag(source, ['payment_info'], defaults.payment_info),
      services: readFeatureFlag(source, ['services'], defaults.services),
      appointment_summary: readFeatureFlag(
        source,
        ['appointment_summary', 'derma_appointment_summary'],
        defaults.appointment_summary
      ),
    },
  };
}

function attachTenantFeatures(base, raw) {
  const { features, featuresFromLookup } = normalizeTenantFeatures(raw, base.packageTier);
  return { ...base, features, featuresFromLookup };
}

/** Flat lookup `features` object from cookie / runtime (source of truth for tabs). */
export function getStoredTenantFeatureSource() {
  const flags = getRuntimeFeatureFlags();
  const raw = flags.raw;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const source = extractFeaturesSource(raw) ?? raw;
  if (!source || typeof source !== 'object' || Array.isArray(source)) return null;
  return /** @type {Record<string, unknown>} */ (source);
}

/**
 * Derma appointment tabs — reads lookup `features` from cookie first.
 * @returns {{ APPOINTMENT_SUMMARY: boolean, FACE_MAP: boolean, BODY_MAP: boolean, LASER_PACKAGES: boolean }}
 */
export function resolveDermaAppointmentTabs() {
  const source = getStoredTenantFeatureSource();
  if (source && hasLookupFeatureKeys(source)) {
    return {
      APPOINTMENT_SUMMARY: readFeatureFlag(
        source,
        ['appointment_summary', 'derma_appointment_summary'],
        true
      ),
      FACE_MAP: readFeatureFlag(source, ['face_map', 'derma_face_map'], false),
      BODY_MAP: readBodyMapDermaFeature(source, false),
      LASER_PACKAGES: readFeatureFlag(
        source,
        ['laser_package', 'laser_packages', 'derma_laser_packages'],
        false
      ),
    };
  }

  const flags = getRuntimeFeatureFlags();
  if (flags.features) {
    const f = flags.features;
    return {
      APPOINTMENT_SUMMARY: f.appointment_summary !== false,
      FACE_MAP: f.face_map === true,
      BODY_MAP: f.body_map_derma === true,
      LASER_PACKAGES: f.laser_package === true,
    };
  }

  return dermaTabsFromEnv();
}

/** Infer derma clinic when lookup enables face/body/laser derma features. */
export function getClinicModeFromTenantFeatures() {
  const source = getStoredTenantFeatureSource();
  if (source && hasLookupFeatureKeys(source)) {
    const isDerma =
      readBodyMapDermaFeature(source, false) ||
      readFeatureFlag(source, ['face_map', 'derma_face_map'], false) ||
      readFeatureFlag(source, ['laser_package', 'laser_packages'], false);
    return isDerma ? 'derma' : null;
  }

  const f = getRuntimeFeatureFlags().features;
  if (!f) return null;
  if (f.body_map_derma || f.face_map || f.laser_package) return 'derma';
  return null;
}

/** @returns {RuntimeFeatureFlags} */
export function buildFeatureFlagsFromEnv() {
  const envClinic = import.meta.env.VITE_DOCTOR_CLINIC_MODE;
  const packageTier = packageTierFromEnv();
  const base = {
    packageTier,
    smsPackage: envBool('VITE_SMS_PACKAGE', true),
    branchLimit: envPositiveInt('VITE_BRANCH_LIMIT'),
    clinicMode:
      envClinic != null && String(envClinic).trim() !== ''
        ? String(envClinic).trim().toLowerCase() === 'derma'
          ? 'derma'
          : 'prescription'
        : null,
    dermaTabs: dermaTabsFromEnv(),
    raw: {},
  };
  return attachTenantFeatures(base, null);
}

function packageTierFromFlagSet(set) {
  if (set.has('package_10k') || set.has('10k')) return '10k';
  if (set.has('package_7_5k') || set.has('7.5k')) return '7.5k';
  if (set.has('package_5k') || set.has('5k')) return '5k';
  return null;
}

function packageTierFromObject(raw) {
  if (truthyFlag(raw.package_10k ?? raw.package10k ?? raw['10k'])) return '10k';
  if (truthyFlag(raw.package_7_5k ?? raw.package7_5k ?? raw.package75k ?? raw['7_5k'])) return '7.5k';
  if (truthyFlag(raw.package_5k ?? raw.package5k ?? raw['5k'])) return '5k';
  const tier = raw.package_tier ?? raw.packageTier ?? raw.tier;
  if (tier != null && String(tier).trim() !== '') {
    const t = normalizeFlagKey(tier);
    if (t === '10k') return '10k';
    if (t === '7_5k' || t === '7.5k') return '7.5k';
    if (t === '5k') return '5k';
    if (t === 'full') return 'full';
  }
  return null;
}

function readTabFlag(raw, keys, defaultValue = true) {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) {
      return truthyFlag(raw[key]);
    }
  }
  return defaultValue;
}

function dermaTabsFromObject(raw) {
  const hasAny =
    raw.derma_appointment_summary != null ||
    raw.derma_face_map != null ||
    raw.derma_body_map != null ||
    raw.derma_laser_packages != null ||
    raw.face_map != null ||
    raw.body_map_derma != null ||
    raw.body_map != null ||
    raw.laser_packages != null;
  if (!hasAny) return null;
  return {
    APPOINTMENT_SUMMARY: readTabFlag(raw, [
      'derma_appointment_summary',
      'appointment_summary',
      'dermaAppointmentSummary',
    ]),
    FACE_MAP: readTabFlag(raw, ['derma_face_map', 'face_map', 'dermaFaceMap']),
    BODY_MAP: readBodyMapDermaFeature(raw, readTabFlag(raw, ['body_map_derma', 'derma_body_map', 'body_map'], true)),
    LASER_PACKAGES: readTabFlag(raw, [
      'derma_laser_packages',
      'laser_packages',
      'dermaLaserPackages',
    ]),
  };
}

/** @param {unknown} raw */
export function normalizeFeatureFlags(raw) {
  const envFallback = buildFeatureFlagsFromEnv();

  if (raw == null) {
    return attachTenantFeatures({ ...envFallback, raw: {} }, null);
  }

  if (Array.isArray(raw)) {
    const set = new Set(raw.map(normalizeFlagKey).filter(Boolean));
    const tier = packageTierFromFlagSet(set) ?? envFallback.packageTier;
    return attachTenantFeatures(
      {
        packageTier: tier,
        smsPackage: set.has('sms_package') || set.has('sms') ? true : envFallback.smsPackage,
        branchLimit: envFallback.branchLimit,
        clinicMode: set.has('derma') || set.has('derma_clinic') ? 'derma' : envFallback.clinicMode,
        dermaTabs: envFallback.dermaTabs,
        raw: Object.fromEntries([...set].map(k => [k, true])),
      },
      raw
    );
  }

  if (typeof raw !== 'object') {
    return attachTenantFeatures({ ...envFallback, raw: {} }, null);
  }

  const obj = /** @type {Record<string, unknown>} */ (raw);
  const tier = packageTierFromObject(obj) ?? envFallback.packageTier;
  const branchRaw = obj.branch_limit ?? obj.branchLimit;
  const branchLimit =
    branchRaw != null && String(branchRaw).trim() !== '' && Number.isFinite(Number(branchRaw))
      ? Math.floor(Number(branchRaw))
      : envFallback.branchLimit;

  let clinicMode = envFallback.clinicMode;
  const clinicRaw = obj.clinic_mode ?? obj.clinicMode ?? obj.doctor_clinic_mode;
  if (clinicRaw != null && String(clinicRaw).trim() !== '') {
    clinicMode = normalizeFlagKey(clinicRaw).includes('derma') ? 'derma' : 'prescription';
  }

  const smsRaw = obj.sms_package ?? obj.smsPackage ?? obj.sms;
  const smsPackage = smsRaw !== undefined && smsRaw !== null ? truthyFlag(smsRaw) : envFallback.smsPackage;

  return attachTenantFeatures(
    {
      packageTier: tier,
      smsPackage,
      branchLimit,
      clinicMode,
      dermaTabs: dermaTabsFromObject(obj) ?? envFallback.dermaTabs,
      raw: obj,
    },
    obj
  );
}

/** @type {RuntimeFeatureFlags|null} */
let runtimeFlags = null;

export function getRuntimeFeatureFlags() {
  if (!runtimeFlags) {
    runtimeFlags = normalizeFeatureFlags(readTenantFeatureFlagsRaw());
  }
  return runtimeFlags;
}

/** @param {unknown} raw */
export function setRuntimeFeatureFlags(raw) {
  runtimeFlags = normalizeFeatureFlags(raw);
  const source = extractFeaturesSource(raw) ?? raw;
  if (
    source &&
    typeof source === 'object' &&
    !Array.isArray(source) &&
    hasLookupFeatureKeys(/** @type {Record<string, unknown>} */ (source))
  ) {
    writeTenantFeatureFlagsRaw(source);
    return;
  }
  writeTenantFeatureFlagsRaw(raw);
}

export function restoreFeatureFlagsFromStorage() {
  const stored = readTenantFeatureFlagsRaw();
  if (stored != null) {
    runtimeFlags = normalizeFeatureFlags(stored);
  } else {
    runtimeFlags = buildFeatureFlagsFromEnv();
  }
  return runtimeFlags;
}

export function resetRuntimeFeatureFlags() {
  runtimeFlags = null;
  writeTenantFeatureFlagsRaw(null);
}

export function getRuntimeClinicMode() {
  return getRuntimeFeatureFlags().clinicMode;
}

export function isBodyMapDermaFeatureEnabled() {
  return resolveDermaAppointmentTabs().BODY_MAP === true;
}

export { hasLookupFeatureKeys };

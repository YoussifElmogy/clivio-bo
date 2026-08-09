import { getRuntimeFeatureFlags, resolveDermaAppointmentTabs } from './featureFlags';

/** Lookup `features` keys (snake_case). Nutrition is stored but intentionally unused. */
export const TENANT_FEATURE = {
  FACE_MAP: 'face_map',
  BODY_MAP_DERMA: 'body_map_derma',
  INVENTORY: 'inventory',
  LASER_PACKAGE: 'laser_package',
  PAYMENT_INFO: 'payment_info',
  SERVICES: 'services',
};

const ROUTE_FEATURE_MAP = [
  { prefix: '/inventory', feature: TENANT_FEATURE.INVENTORY },
  { prefix: '/services', feature: TENANT_FEATURE.SERVICES },
  { prefix: '/laser', feature: TENANT_FEATURE.LASER_PACKAGE },
];

function pathMatchesPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Normalized tenant features from lookup cookie or env defaults. */
export function getTenantFeatures() {
  return getRuntimeFeatureFlags().features;
}

/** Whether lookup returned an explicit `features` object (vs env-only defaults). */
export function hasLookupFeatures() {
  return getRuntimeFeatureFlags().featuresFromLookup === true;
}

/** @param {string} key — use TENANT_FEATURE.* */
export function isTenantFeatureEnabled(key) {
  const features = getTenantFeatures();
  if (!features || typeof features !== 'object') return true;
  if (features[key] === undefined) return true;
  return features[key] === true;
}

export function isTenantFeatureNavAllowed(navPath) {
  const path = String(navPath ?? '').trim();
  for (const { prefix, feature } of ROUTE_FEATURE_MAP) {
    if (path === prefix) return isTenantFeatureEnabled(feature);
  }
  return true;
}

export function isTenantFeatureRouteAllowed(pathname) {
  const path = String(pathname ?? '').trim();
  for (const { prefix, feature } of ROUTE_FEATURE_MAP) {
    if (pathMatchesPrefix(path, prefix)) return isTenantFeatureEnabled(feature);
  }
  return true;
}

/** Derma appointment tabs driven by tenant features (nutrition ignored). */
export function getTenantDermaAppointmentTabs() {
  return resolveDermaAppointmentTabs();
}

export function isTenantPaymentInfoEnabled() {
  return isTenantFeatureEnabled(TENANT_FEATURE.PAYMENT_INFO);
}

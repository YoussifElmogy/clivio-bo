import { getRuntimeFeatureFlags } from './featureFlags';
import {
  isTenantFeatureNavAllowed,
  isTenantFeatureRouteAllowed,
} from './tenantFeatures';
import { resolveDermaAppointmentTabs, hasLookupFeatureKeys } from './featureFlags';

/** @returns {'5k' | '7.5k' | '10k' | 'full'} */
export function resolvePackageTier() {
  return getRuntimeFeatureFlags().packageTier;
}

function hasStoredLookupFeatures() {
  const raw = getRuntimeFeatureFlags().raw;
  if (!raw || typeof raw !== 'object') return false;
  return hasLookupFeatureKeys(raw) || getRuntimeFeatureFlags().featuresFromLookup === true;
}

/** Sidebar routes hidden on 5k package (legacy env fallback only). */
const SIDEBAR_BLOCKED_5K = new Set(['/inventory', '/services', '/laser']);

function isLegacyPackageNavAllowed(navPath) {
  if (resolvePackageTier() !== '5k') return true;
  return !SIDEBAR_BLOCKED_5K.has(navPath);
}

function isLegacyPackageRouteAllowed(pathname) {
  if (resolvePackageTier() !== '5k') return true;
  const blockedPrefixes = ['/inventory', '/services', '/laser'];
  return !blockedPrefixes.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isPackageSidebarNavAllowed(navPath) {
  if (hasStoredLookupFeatures()) {
    return isTenantFeatureNavAllowed(navPath);
  }
  return isLegacyPackageNavAllowed(navPath);
}

export function isPackageRouteAllowed(pathname) {
  if (hasStoredLookupFeatures()) {
    return isTenantFeatureRouteAllowed(pathname);
  }
  return isLegacyPackageRouteAllowed(pathname);
}

/** Derma tabs from lookup `features` (cookie) — no package-tier override. */
export function getResolvedDermaAppointmentTabs() {
  return resolveDermaAppointmentTabs();
}

export function isSmsPackageEnabled() {
  return getRuntimeFeatureFlags().smsPackage;
}

export function getBranchLimit() {
  return getRuntimeFeatureFlags().branchLimit;
}

export function canAddMoreBranches(currentCount) {
  const limit = getBranchLimit();
  if (limit == null) return true;
  return Number(currentCount) < limit;
}

export function branchLimitLabel() {
  const limit = getBranchLimit();
  return limit != null ? String(limit) : null;
}

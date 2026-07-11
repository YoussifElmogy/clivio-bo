/** Subscription / deployment package flags from Vite env. */

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

/** @returns {'5k' | '7.5k' | '10k' | 'full'} */
export function resolvePackageTier() {
  if (envBool('VITE_PACKAGE_10K')) return '10k';
  if (envBool('VITE_PACKAGE_7_5K')) return '7.5k';
  if (envBool('VITE_PACKAGE_5K')) return '5k';
  return 'full';
}

export const PACKAGE_TIER = resolvePackageTier();

/** Sidebar routes hidden on 5k package. */
const SIDEBAR_BLOCKED_5K = new Set(['/inventory', '/services', '/laser']);

export function isPackageSidebarNavAllowed(navPath) {
  if (PACKAGE_TIER !== '5k') return true;
  return !SIDEBAR_BLOCKED_5K.has(navPath);
}

/** Block direct URL access to inventory / services / laser on 5k. */
export function isPackageRouteAllowed(pathname) {
  if (PACKAGE_TIER !== '5k') return true;
  const blockedPrefixes = ['/inventory', '/services', '/laser'];
  return !blockedPrefixes.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** Derma appointment tabs by package tier. */
export function getPackageDermaTabs() {
  if (PACKAGE_TIER === '5k' || PACKAGE_TIER === '7.5k') {
    return {
      APPOINTMENT_SUMMARY: true,
      FACE_MAP: false,
      BODY_MAP: false,
      LASER_PACKAGES: false,
    };
  }
  return null;
}

export function isSmsPackageEnabled() {
  return envBool('VITE_SMS_PACKAGE', true);
}

export function getBranchLimit() {
  return envPositiveInt('VITE_BRANCH_LIMIT');
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

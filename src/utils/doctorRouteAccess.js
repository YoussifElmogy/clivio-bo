/** Doctor home — matches post-login redirect and sidebar logo link. */
export const DOCTOR_HOME_PATH = '/appointments';

/** Top-level routes shown in the doctor sidebar. */
export const DOCTOR_SIDEBAR_ROUTES = new Set([
  '/appointments',
  '/patients',
  '/doctor-medicines',
  '/general-services',
]);

/**
 * Utility routes not in sidebar but always allowed (account menu).
 */
const DOCTOR_UTILITY_ROUTES = new Set(['/change-password']);

/**
 * Explicit allowlist for doctor URL access (sidebar sections + linked sub-pages).
 * Anything else typed in the browser redirects to DOCTOR_HOME_PATH.
 */
const DOCTOR_ALLOWED_PATH_PATTERNS = [
  /^\/appointments$/,
  /^\/appointments\/[^/]+\/(derma-mapping|view)$/,
  /^\/patients$/,
  /^\/patients\/[^/]+\/profile$/,
  /^\/doctor-medicines(?:\/|$)/,
  /^\/general-services(?:\/|$)/,
  /^\/change-password$/,
];

function normalizePathname(pathname) {
  if (!pathname || typeof pathname !== 'string') return '/';
  const path = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '');
  return path || '/';
}

export function isDoctorSidebarRoute(navPath) {
  return DOCTOR_SIDEBAR_ROUTES.has(navPath);
}

export function isDoctorRouteAllowed(pathname) {
  const path = normalizePathname(pathname);
  if (DOCTOR_UTILITY_ROUTES.has(path)) return true;
  return DOCTOR_ALLOWED_PATH_PATTERNS.some(pattern => pattern.test(path));
}

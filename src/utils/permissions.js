import { isSuperAdminUser } from './authRoles';

/**
 * Normalize roles from login / stored user.
 * @param {unknown} raw
 * @returns {{ id?: unknown, role_name: string }[]}
 */
export function normalizeRolesFromAuth(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(r => {
      if (!r || typeof r !== 'object') return null;
      const role_name =
        typeof r.role_name === 'string'
          ? r.role_name.trim()
          : typeof r.roleName === 'string'
            ? r.roleName.trim()
            : '';
      if (!role_name) return null;
      return {
        id: r.id ?? r.role_id,
        role_name,
      };
    })
    .filter(Boolean);
}

/**
 * Full access: super-admin, or legacy sessions with no role list from API.
 */
export function shouldBypassPermissions(user) {
  if (!user || typeof user !== 'object') return false;
  if (isSuperAdminUser(user)) return true;
  const roles = user.roles;
  if (!Array.isArray(roles)) return true;
  if (roles.length === 0) return true;
  return false;
}

/**
 * @returns {Set<string>|null} null when bypass (all allowed); otherwise lowercase role_name set
 */
export function buildPermissionSet(user) {
  if (shouldBypassPermissions(user)) return null;
  const roles = normalizeRolesFromAuth(user?.roles);
  const set = new Set();
  for (const r of roles) {
    set.add(String(r.role_name).toLowerCase());
  }
  return set;
}

/**
 * @param {object|null|undefined} user
 * @param {string|null|undefined} permission - e.g. PERM.VIEW_PATIENT
 */
export function canPermission(user, permission) {
  if (!permission) return true;
  if (shouldBypassPermissions(user)) return true;
  const set = buildPermissionSet(user);
  if (!set) return true;
  return set.has(String(permission).toLowerCase());
}

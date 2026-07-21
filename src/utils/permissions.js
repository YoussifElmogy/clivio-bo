import { isSuperAdminUser } from './authRoles';

/** Normalize API permission keys to snake_case lowercase (e.g. view_laser). */
export function normalizePermissionKey(name) {
  if (name == null) return '';
  return String(name).trim().toLowerCase().replace(/[\s-]+/g, '_');
}

/**
 * Normalize roles from login / stored user.
 * Supports objects ({ role_name }) and plain permission strings.
 * @param {unknown} raw
 * @returns {{ id?: unknown, role_name: string }[]}
 */
export function normalizeRolesFromAuth(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(r => {
      if (typeof r === 'string') {
        const role_name = normalizePermissionKey(r);
        if (!role_name) return null;
        return { role_name };
      }
      if (!r || typeof r !== 'object') return null;
      const rawName =
        typeof r.role_name === 'string'
          ? r.role_name
          : typeof r.roleName === 'string'
            ? r.roleName
            : typeof r.name === 'string'
              ? r.name
              : '';
      const role_name = normalizePermissionKey(rawName);
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
    set.add(normalizePermissionKey(r.role_name));
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
  return set.has(normalizePermissionKey(permission));
}

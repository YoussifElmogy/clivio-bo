function normalizeRoleName(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function isSuperAdminRoleName(value) {
  const normalized = normalizeRoleName(value);
  return normalized === 'superadmin' || normalized === 'superadministrator';
}

function roleNamesFromUserRolesArray(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(entry => {
      if (typeof entry === 'string') return entry.trim();
      if (entry && typeof entry === 'object') {
        const name = entry.role_name ?? entry.roleName ?? entry.name;
        return typeof name === 'string' ? name.trim() : '';
      }
      return '';
    })
    .filter(Boolean);
}

/** Primary account role for display and role checks (handles string or array from JWT/API). */
export function normalizeAccountRole(role) {
  if (typeof role === 'string') {
    const trimmed = role.trim();
    return trimmed || 'Staff';
  }
  if (Array.isArray(role)) {
    for (const entry of role) {
      const value = typeof entry === 'string' ? entry.trim() : '';
      if (value && isSuperAdminRoleName(value)) return 'Super Admin';
    }
    const first = role.find(entry => typeof entry === 'string' && entry.trim());
    return first ? first.trim() : 'Staff';
  }
  return 'Staff';
}

export function isSuperAdminUser(user) {
  if (!user || typeof user !== 'object') return false;
  if (isSuperAdminRoleName(normalizeAccountRole(user.role))) return true;
  return roleNamesFromUserRolesArray(user.roles).some(isSuperAdminRoleName);
}

export function isAssistantUser(user) {
  return normalizeRoleName(normalizeAccountRole(user?.role)) === 'assistant';
}

export function isDoctorUser(user) {
  return normalizeRoleName(normalizeAccountRole(user?.role)) === 'doctor';
}

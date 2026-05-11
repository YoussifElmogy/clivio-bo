/**
 * Detects super-admin from auth user (JWT / login `user.role` string).
 */
export function isSuperAdminUser(user) {
  const role = user?.role;
  if (typeof role !== 'string') return false;
  const normalized = role.trim().toLowerCase().replace(/[\s_-]+/g, '');
  return normalized === 'superadmin' || normalized === 'superadministrator';
}

export function isDoctorUser(user) {
  const role = user?.role;
  if (typeof role !== 'string') return false;
  const normalized = role.trim().toLowerCase().replace(/[\s_-]+/g, '');
  return normalized === 'doctor';
}

/**
 * Decode JWT payload (no signature verification — for display only).
 */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getUserRoleFromToken(token) {
  const p = decodeJwtPayload(token);
  if (!p) return null;
  return (
    p.role ||
    p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
    p.Role ||
    null
  );
}

export function getFullNameFromToken(token) {
  const p = decodeJwtPayload(token);
  if (!p) return null;
  return (
    p.name ||
    p.fullName ||
    p.full_name ||
    p.given_name ||
    p.unique_name ||
    null
  );
}

export function getUsernameFromToken(token) {
  const p = decodeJwtPayload(token);
  if (!p) return null;
  return (
    p.username ||
    p.preferred_username ||
    p.email ||
    p.sub ||
    null
  );
}

export function getUserIdFromToken(token) {
  const p = decodeJwtPayload(token);
  if (!p) return null;
  return p.id || p.user_id || p.userId || p.uid || p.sub || null;
}

export function getClinicModeFromToken(token) {
  const p = decodeJwtPayload(token);
  if (!p) return null;
  return p.clinic_mode ?? p.clinicMode ?? p.clinic_type ?? p.clinicType ?? null;
}

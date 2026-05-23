/** Branch ids assigned to the logged-in user (e.g. assistant login). */
export function normalizeUserBranchIds(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(Number).filter(n => !Number.isNaN(n) && n > 0);
}

export function getUserBranchIds(user) {
  if (!user || typeof user !== 'object') return [];
  return normalizeUserBranchIds(user.branch_ids ?? user.branchIds);
}

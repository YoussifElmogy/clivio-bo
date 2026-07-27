import { recoverFromChunkError } from './chunkLoadRecovery';

const STORAGE_KEY = 'clivio_deploy_built_at';

/**
 * After a deploy, users may still run a cached index.html + JS bundle.
 * Compare server version.json (no-store) and reload once when it changes.
 * @returns {Promise<boolean>} false if a reload was triggered
 */
export async function ensureLatestDeploy() {
  if (import.meta.env.DEV) return true;

  try {
    const res = await fetch(`/version.json?_=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return true;

    const data = await res.json();
    const builtAt = data?.builtAt != null ? String(data.builtAt) : '';
    if (!builtAt) return true;

    const previous = localStorage.getItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, builtAt);

    if (previous && previous !== builtAt) {
      recoverFromChunkError();
      return false;
    }
  } catch {
    // Offline or missing version.json — keep running.
  }

  return true;
}

import { lazy } from 'react';

const CHUNK_RELOAD_KEY = 'clivio_chunk_reload_attempted';

function isChunkLoadError(error) {
  const message = String(error?.message ?? error ?? '').toLowerCase();
  return (
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('importing a module script failed') ||
    message.includes('error loading dynamically imported module')
  );
}

/**
 * Lazy-load a route chunk; on stale deploy / missing chunk, reload once then retry.
 */
export function lazyWithRetry(importFn) {
  return lazy(async () => {
    const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY) === 'true';

    try {
      const module = await importFn();
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      return module;
    } catch (error) {
      if (isChunkLoadError(error) && !alreadyReloaded) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, 'true');
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }
  });
}

export default lazyWithRetry;

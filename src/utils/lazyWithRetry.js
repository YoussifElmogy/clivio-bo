import { lazy } from 'react';

const RELOAD_FLAG_KEY = 'clivio-bo:chunk-reload';
const RELOAD_TS_KEY = 'clivio-bo:chunk-reload-ts';
const RELOAD_COOLDOWN_MS = 10_000;

export function isChunkLoadError(error) {
  const msg = String(error?.message ?? error ?? '').toLowerCase();
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('loading chunk') ||
    msg.includes('loading css chunk') ||
    msg.includes('dynamically imported module')
  );
}

/** Reload once so the browser picks up the latest deployed asset hashes. */
export function reloadAfterChunkError() {
  const now = Date.now();
  const lastReload = Number(sessionStorage.getItem(RELOAD_TS_KEY) || 0);
  const recentlyReloaded =
    sessionStorage.getItem(RELOAD_FLAG_KEY) === '1' && now - lastReload < RELOAD_COOLDOWN_MS;

  if (recentlyReloaded) return false;

  sessionStorage.setItem(RELOAD_FLAG_KEY, '1');
  sessionStorage.setItem(RELOAD_TS_KEY, String(now));
  window.location.reload();
  return true;
}

export function lazyWithRetry(importFn) {
  return lazy(() =>
    importFn().catch(error => {
      if (isChunkLoadError(error) && reloadAfterChunkError()) {
        return new Promise(() => {});
      }
      throw error;
    })
  );
}

export function registerChunkLoadRecovery() {
  window.addEventListener('vite:preloadError', event => {
    event.preventDefault();
    reloadAfterChunkError();
  });

  window.addEventListener('unhandledrejection', event => {
    if (isChunkLoadError(event.reason) && reloadAfterChunkError()) {
      event.preventDefault();
    }
  });
}

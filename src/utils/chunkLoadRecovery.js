const RELOAD_KEY = 'clivio_chunk_reload_ts';
const RELOAD_COOLDOWN_MS = 12000;

export function isChunkLoadError(error) {
  const message = String(error?.message ?? error ?? '').toLowerCase();
  return (
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('importing a module script failed') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('failed to load module script') ||
    message.includes('mime type') ||
    message.includes('module script')
  );
}

export function isChunkScriptTarget(target) {
  if (!target || target.tagName !== 'SCRIPT') return false;
  const src = String(target.src ?? '');
  return src.includes('/assets/') && src.endsWith('.js');
}

/** Reload with cache-bust query param; returns false if reloaded too recently (avoid loops). */
export function recoverFromChunkError() {
  const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
  const now = Date.now();
  if (now - last < RELOAD_COOLDOWN_MS) {
    return false;
  }
  sessionStorage.setItem(RELOAD_KEY, String(now));
  const url = new URL(window.location.href);
  url.searchParams.set('_cb', String(now));
  window.location.replace(url.toString());
  return true;
}

export function clearChunkReloadFlag() {
  sessionStorage.removeItem(RELOAD_KEY);
}

export function registerChunkLoadRecovery() {
  window.addEventListener('vite:preloadError', event => {
    event.preventDefault();
    recoverFromChunkError();
  });

  window.addEventListener(
    'error',
    event => {
      if (isChunkLoadError(event.message) || isChunkScriptTarget(event.target)) {
        event.preventDefault();
        recoverFromChunkError();
      }
    },
    true
  );

  window.addEventListener('unhandledrejection', event => {
    if (isChunkLoadError(event.reason)) {
      event.preventDefault();
      recoverFromChunkError();
    }
  });
}

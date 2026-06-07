import { lazy } from 'react';
import {
  clearChunkReloadFlag,
  isChunkLoadError,
  recoverFromChunkError,
} from './chunkLoadRecovery';

const RETRY_DELAY_MS = 400;

/**
 * Lazy-load a route chunk; retry briefly, then cache-bust reload on stale deploy.
 */
export function lazyWithRetry(importFn) {
  return lazy(async () => {
    let lastError;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const module = await importFn();
        clearChunkReloadFlag();
        return module;
      } catch (error) {
        lastError = error;
        if (!isChunkLoadError(error)) {
          throw error;
        }
        if (attempt === 0) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }
    }

    if (recoverFromChunkError()) {
      return new Promise(() => {});
    }

    throw lastError;
  });
}

export default lazyWithRetry;

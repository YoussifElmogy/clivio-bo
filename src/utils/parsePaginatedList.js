/**
 * Normalizes list API responses: plain array, or `{ results, total|count }`, `{ data }`, or custom list keys.
 *
 * @param {unknown} data
 * @param {{ listKeys?: string[] }} [options] extra object keys to treat as a row array (client-side list)
 * @returns {{ mode: 'server' | 'client', rows: unknown[], total: number }}
 */
function readPaginationTotal(data, fallback) {
  if (data && typeof data === 'object') {
    if (typeof data.total === 'number' && !Number.isNaN(data.total)) return data.total;
    if (typeof data.count === 'number' && !Number.isNaN(data.count)) return data.count;
  }
  return fallback;
}

function hasServerPagination(data) {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.total === 'number' && !Number.isNaN(data.total)) return true;
  if (typeof data.count === 'number' && !Number.isNaN(data.count)) return true;
  if (data.next != null || data.previous != null) return true;
  return false;
}

export function parsePaginatedList(data, options = {}) {
  const { listKeys = [] } = options;

  if (Array.isArray(data)) {
    return { mode: 'client', rows: data, total: data.length };
  }

  if (data && typeof data === 'object' && Array.isArray(data.results)) {
    const rows = data.results;
    return {
      mode: hasServerPagination(data) ? 'server' : 'client',
      rows,
      total: readPaginationTotal(data, rows.length),
    };
  }

  if (data && typeof data === 'object') {
    if (Array.isArray(data.data)) {
      const rows = data.data;
      return {
        mode: hasServerPagination(data) ? 'server' : 'client',
        rows,
        total: readPaginationTotal(data, rows.length),
      };
    }
    for (const key of listKeys) {
      if (Array.isArray(data[key])) {
        const rows = data[key];
        return {
          mode: hasServerPagination(data) ? 'server' : 'client',
          rows,
          total: readPaginationTotal(data, rows.length),
        };
      }
    }
  }

  return { mode: 'client', rows: [], total: 0 };
}

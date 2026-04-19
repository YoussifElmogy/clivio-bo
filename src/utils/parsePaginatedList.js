/**
 * Normalizes list API responses: plain array, or `{ results, total }`, `{ data }`, or custom list keys.
 *
 * @param {unknown} data
 * @param {{ listKeys?: string[] }} [options] extra object keys to treat as a row array (client-side list)
 * @returns {{ mode: 'server' | 'client', rows: unknown[], total: number }}
 */
export function parsePaginatedList(data, options = {}) {
  const { listKeys = [] } = options;

  if (Array.isArray(data)) {
    return { mode: 'client', rows: data, total: data.length };
  }

  if (data && typeof data === 'object' && Array.isArray(data.results)) {
    const total =
      typeof data.total === 'number' && !Number.isNaN(data.total)
        ? data.total
        : data.results.length;
    return { mode: 'server', rows: data.results, total };
  }

  if (data && typeof data === 'object') {
    if (Array.isArray(data.data)) {
      const rows = data.data;
      return { mode: 'client', rows, total: rows.length };
    }
    for (const key of listKeys) {
      if (Array.isArray(data[key])) {
        const rows = data[key];
        return { mode: 'client', rows, total: rows.length };
      }
    }
  }

  return { mode: 'client', rows: [], total: 0 };
}

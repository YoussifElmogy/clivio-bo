import { areaPackageDefaultValues } from '../schemas/areaPackageSchema';

function unwrapEntity(data, keys = ['area_package', 'data', 'result']) {
  if (!data || typeof data !== 'object') return data;
  for (const k of keys) {
    const inner = data[k];
    if (inner && typeof inner === 'object') return inner;
  }
  return data;
}

export function mergeAreaPackageFromApi(data) {
  const row = unwrapEntity(data);
  if (!row || typeof row !== 'object') {
    return { ...areaPackageDefaultValues };
  }
  return {
    name: typeof row.name === 'string' ? row.name : '',
    price: row.price != null ? String(row.price) : '',
    description: typeof row.description === 'string' ? row.description : '',
  };
}

export function buildAreaPackagePayload(values) {
  const description = typeof values.description === 'string' ? values.description.trim() : '';
  const body = {
    name: String(values.name ?? '').trim(),
    price: String(values.price ?? '').trim(),
  };
  if (description) body.description = description;
  return body;
}

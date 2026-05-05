import { pulsePackageDefaultValues } from '../schemas/pulsePackageSchema';

function unwrapEntity(data, keys = ['pulse_package', 'data', 'result']) {
  if (!data || typeof data !== 'object') return data;
  for (const k of keys) {
    const inner = data[k];
    if (inner && typeof inner === 'object') return inner;
  }
  return data;
}

export function mergePulsePackageFromApi(data) {
  const row = unwrapEntity(data);
  if (!row || typeof row !== 'object') {
    return { ...pulsePackageDefaultValues };
  }
  const rawPulses = row.pulses;
  const n = rawPulses === '' || rawPulses == null ? NaN : Number(rawPulses);
  const pulses = Number.isFinite(n) ? n : '';
  return {
    pulses,
    price: row.price != null ? String(row.price) : '',
    description: typeof row.description === 'string' ? row.description : '',
  };
}

export function buildPulsePackagePayload(values) {
  const description = typeof values.description === 'string' ? values.description.trim() : '';
  const body = {
    pulses: Number(values.pulses),
    price: String(values.price ?? '').trim(),
  };
  if (description) body.description = description;
  return body;
}

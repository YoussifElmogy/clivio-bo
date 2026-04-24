import { machineDefaultValues } from '../schemas/machineSchema';

export function mergeMachineFromApi(data) {
  const row =
    data && typeof data === 'object' && data.machine && typeof data.machine === 'object'
      ? data.machine
      : data;
  if (!row || typeof row !== 'object') {
    return { ...machineDefaultValues };
  }

  const serviceRaw = row.service ?? row.service_id;
  const service =
    serviceRaw !== '' && serviceRaw != null && !Number.isNaN(Number(serviceRaw))
      ? Number(serviceRaw)
      : '';

  const allowed = new Set(['pulses', 'duration', 'injectables', 'sessions']);
  const type = allowed.has(String(row.type)) ? String(row.type) : 'pulses';

  return {
    service,
    name: typeof row.name === 'string' ? row.name : '',
    type,
    price:
      row.price !== '' && row.price != null && !Number.isNaN(Number(row.price)) ? Number(row.price) : '',
    description: typeof row.description === 'string' ? row.description : '',
  };
}

export function buildMachinePayload(values) {
  const description = typeof values.description === 'string' ? values.description.trim() : '';

  return {
    service: Number(values.service),
    name: String(values.name ?? '').trim(),
    type: String(values.type ?? 'pulses'),
    price: Number(values.price),
    ...(description ? { description } : {}),
  };
}

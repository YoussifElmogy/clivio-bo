import { machineDefaultValues } from '../schemas/machineSchema';

function sliceDateOnly(value) {
  if (value == null) return '';
  const s = String(value).trim();
  return s.length >= 10 ? s.slice(0, 10) : s;
}

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
    latest_maintenance_date: sliceDateOnly(row.latest_maintenance_date),
  };
}

export function buildMachinePayload(values) {
  const description = typeof values.description === 'string' ? values.description.trim() : '';
  const maintenance =
    typeof values.latest_maintenance_date === 'string' ? values.latest_maintenance_date.trim() : '';

  return {
    service: Number(values.service),
    name: String(values.name ?? '').trim(),
    type: String(values.type ?? 'pulses'),
    price: Number(values.price),
    ...(description ? { description } : {}),
    latest_maintenance_date: maintenance || null,
  };
}

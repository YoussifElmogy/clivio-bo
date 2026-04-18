import { branchDefaultValues } from '../schemas/branchSchema';

function normalizeTime(value) {
  if (value == null || typeof value !== 'string') return '';
  const t = value.trim();
  if (t.length >= 5) return t.slice(0, 5);
  return t;
}

export function buildBranchPayload(values) {
  const vacationRaw = Array.isArray(values.vacation_days) ? values.vacation_days : [];
  const vacation_days = [...new Set(vacationRaw.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 6))].sort(
    (a, b) => a - b
  );

  return {
    name: values.name.trim(),
    phone: values.phone.trim(),
    address: values.address.trim(),
    is_active: Boolean(values.active),
    from_time: normalizeTime(values.from_time),
    to_time: normalizeTime(values.to_time),
    vacation_days,
  };
}

/** Maps GET /branches/:id response into react-hook-form default values. */
export function mergeBranchFromApi(data) {
  if (!data || typeof data !== 'object') return { ...branchDefaultValues };
  const vd = data.vacation_days;
  const vacation_days = Array.isArray(vd)
    ? [...new Set(vd.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 6))].sort((a, b) => a - b)
    : [];

  const from = normalizeTime(data.from_time ?? '');
  const to = normalizeTime(data.to_time ?? '');

  return {
    name: data.name ?? '',
    phone: data.phone ?? '',
    address: data.address ?? '',
    active: Boolean(data.is_active ?? data.active ?? true),
    from_time: from || branchDefaultValues.from_time,
    to_time: to || branchDefaultValues.to_time,
    vacation_days,
  };
}

import { branchDefaultValues } from '../schemas/branchSchema';

export function buildBranchPayload(values) {
  return {
    name: values.name.trim(),
    phone: values.phone.trim(),
    address: values.address.trim(),
    is_active: Boolean(values.active),
  };
}

/** Maps GET /branches/:id response into react-hook-form default values. */
export function mergeBranchFromApi(data) {
  if (!data || typeof data !== 'object') return { ...branchDefaultValues };
  return {
    name: data.name ?? '',
    phone: data.phone ?? '',
    address: data.address ?? '',
    active: Boolean(data.is_active ?? data.active ?? true),
  };
}

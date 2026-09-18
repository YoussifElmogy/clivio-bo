import { serviceDefaultValues } from '../schemas/serviceSchema';

export function mergeServiceFromApi(data) {
  const row =
    data && typeof data === 'object' && data.service && typeof data.service === 'object'
      ? data.service
      : data;

  if (!row || typeof row !== 'object') {
    return { ...serviceDefaultValues };
  }

  const category =
    row.category === 'machine' || row.category === 'injectable' ? row.category : 'injectable';

  const clinicFeesRaw = row.clinic_fees ?? row.clinicFees;
  const clinicFees =
    clinicFeesRaw === '' || clinicFeesRaw == null || Number.isNaN(Number(clinicFeesRaw))
      ? ''
      : Number(clinicFeesRaw);

  return {
    name: typeof row.name === 'string' ? row.name : '',
    category,
    description: typeof row.description === 'string' ? row.description : '',
    clinicFees,
  };
}

export function buildServicePayload(values) {
  const description = typeof values.description === 'string' ? values.description.trim() : '';
  const clinicFeesRaw = values.clinicFees;
  const hasClinicFees =
    clinicFeesRaw !== '' && clinicFeesRaw != null && !Number.isNaN(Number(clinicFeesRaw));

  return {
    name: String(values.name ?? '').trim(),
    category: values.category === 'machine' ? 'machine' : 'injectable',
    ...(description ? { description } : {}),
    ...(hasClinicFees ? { clinic_fees: Number(clinicFeesRaw) } : {}),
  };
}

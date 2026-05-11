import { doctorMedicineDefaultValues } from '../schemas/doctorMedicineSchema';

export function mergeDoctorMedicineFromApi(data) {
  const row =
    data && typeof data === 'object' && data.doctor_medicine && typeof data.doctor_medicine === 'object'
      ? data.doctor_medicine
      : data;
  if (!row || typeof row !== 'object') return { ...doctorMedicineDefaultValues };

  const doctorRaw = row.doctor ?? row.doctor_id ?? row.doctor?.id;
  const doctor =
    doctorRaw !== '' && doctorRaw != null && !Number.isNaN(Number(doctorRaw)) ? Number(doctorRaw) : '';

  return {
    doctor,
    name: typeof row.name === 'string' ? row.name : '',
    concentration: typeof row.concentration === 'string' ? row.concentration : '',
  };
}

export function buildDoctorMedicinePayload(values, options = {}) {
  const { includeDoctorId = true } = options;

  return {
    ...(includeDoctorId ? { doctor_id: Number(values.doctor) } : {}),
    name: String(values.name ?? '').trim(),
    concentration: String(values.concentration ?? '').trim(),
  };
}

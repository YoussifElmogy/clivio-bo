export const DOCTOR_FILTER_ALL = '';

export function normalizeDoctorsList(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.doctors)) return data.doctors;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

export function doctorSelectOptions(doctors, branchId) {
  const bid = String(branchId ?? '').trim();
  return (doctors || [])
    .filter(doctor => {
      if (!bid || bid === 'all') return true;
      const branches = Array.isArray(doctor?.assigned_branches) ? doctor.assigned_branches : [];
      return branches.some(b => String(b?.id ?? '') === bid);
    })
    .map(doctor => ({
      id: String(doctor?.id ?? ''),
      name: String(doctor?.name ?? '').trim() || `Doctor #${doctor?.id ?? ''}`,
    }))
    .filter(d => d.id)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Paginated GET /doctors — loads all pages. */
export async function fetchAllDoctors(get) {
  const pageSize = 100;
  let page = 1;
  let safety = 0;
  const all = [];
  while (safety < 200) {
    const data = await get(`/doctors?page=${page}&page_size=${pageSize}`);
    const rows = normalizeDoctorsList(data);
    all.push(...rows);
    const totalRaw = Number(data?.total ?? data?.count);
    const total = Number.isFinite(totalRaw) ? totalRaw : all.length;
    if (rows.length === 0 || rows.length < pageSize || all.length >= total) break;
    page += 1;
    safety += 1;
  }
  return all;
}

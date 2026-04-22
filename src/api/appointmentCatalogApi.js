/**
 * Portal-aligned catalog — public endpoints and client-side slot-day derivation from schedules.
 * Used by `useAppointmentCatalog` (same call pattern as portal `useRegistrationCatalog`).
 */

import { apiClient } from '../configs/apiClient';

/** Branch API uses 0 = Saturday … 6 = Friday (same as branch `vacation_days`). */
function apiDayFromJsWeekday(jsWeekday) {
  return (jsWeekday + 1) % 7;
}

/** Next `horizonDays` calendar days whose API weekday appears in `apiDays`. */
function collectIsoDaysForApiDays(apiDays, horizonDays = 90) {
  const set = new Set(
    apiDays.map(n => Number(n)).filter(n => !Number.isNaN(n) && n >= 0 && n <= 6)
  );
  if (!set.size) return [];

  const out = [];
  const seen = new Set();
  const start = new Date();
  start.setHours(12, 0, 0, 0);

  for (let i = 0; i < horizonDays; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const apiD = apiDayFromJsWeekday(d.getDay());
    if (!set.has(apiD)) continue;
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const iso = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (!seen.has(iso)) {
      seen.add(iso);
      out.push(iso);
    }
  }
  return out.sort();
}

function getScheduleForBranch(mappedDoctor, branchIdStr) {
  const bid = String(branchIdStr ?? '').trim();
  if (!bid || !mappedDoctor?.assignedBranches?.length) return [];
  const match = mappedDoctor.assignedBranches.find(b => String(b.id) === bid);
  return Array.isArray(match?.schedule) ? match.schedule : [];
}

function mapDoctorFromApi(raw) {
  return {
    id: String(raw.id ?? ''),
    name: raw.name ?? '',
    email: raw.email ?? '',
    phone: raw.phone ?? '',
    specialty: raw.specialty ?? '',
    assignedBranches: Array.isArray(raw.assigned_branches)
      ? raw.assigned_branches.map(b => ({
          id: b.id,
          name: b.name ?? '',
          schedule: Array.isArray(b.schedule)
            ? b.schedule.map(s => ({
                day: Number(s.day),
                fromTime: s.from_time ?? '',
                toTime: s.to_time ?? '',
              }))
            : [],
        }))
      : [],
  };
}

/**
 * Doctors at a branch.
 * GET /public/doctors?branch_id=…
 *
 * @param {string | null | undefined} branchId
 */
export async function fetchDoctorsForBranch(branchId) {
  const bid = branchId?.trim?.() ?? String(branchId ?? '').trim();
  if (!bid) return [];

  const { data } = await apiClient.get('/public/doctors', {
    params: { branch_id: bid },
  });
  const list = Array.isArray(data) ? data : [];

  return list
    .filter(d => d?.is_active !== false)
    .map(mapDoctorFromApi)
    .filter(d => d.id);
}

export async function fetchBranches() {
  const { data } = await apiClient.get('/public/branches');
  const items = Array.isArray(data?.results) ? data.results : [];

  return items
    .filter(branch => branch?.is_active !== false)
    .map(branch => ({
      id: String(branch.id ?? ''),
      name: branch.name ?? '',
      line: branch.address ?? '',
      address: branch.address ?? '',
      phone: branch.phone ?? '',
      workingHours:
        branch.working_hours?.from && branch.working_hours?.to
          ? `${branch.working_hours.from} - ${branch.working_hours.to}`
          : '',
      vacationDaysLabels: Array.isArray(branch.vacation_days_labels) ? branch.vacation_days_labels : [],
      totalDoctors:
        typeof branch.total_doctors === 'number' ? branch.total_doctors : Number(branch.total_doctors) || 0,
    }))
    .filter(branch => branch.id);
}

function uniqueApiDaysFromSchedule(schedule) {
  const days = (schedule || [])
    .map(s => Number(s.day))
    .filter(n => !Number.isNaN(n) && n >= 0 && n <= 6);
  return [...new Set(days)].sort((a, b) => a - b);
}

/**
 * @param {string | null | undefined} doctorId — empty = union across all doctors at branch
 * @param {string | null | undefined} branchId
 * @param {Array<{ id: string, assignedBranches: unknown }>} doctors — mapped doctors for this branch
 * @returns {Promise<string[]>} ISO dates (YYYY-MM-DD)
 */
export async function fetchSlotDaysForDoctor(doctorId, branchId, doctors = []) {
  const bid = branchId?.trim?.() ?? String(branchId ?? '').trim();
  if (!bid) return [];

  const id = doctorId?.trim?.() ?? '';
  const active = (doctors || []).filter(d => d?.id);

  if (id) {
    const doc = active.find(d => d.id === id);
    if (!doc) return [];
    const schedule = getScheduleForBranch(doc, bid);
    const apiDays = uniqueApiDaysFromSchedule(schedule);
    return collectIsoDaysForApiDays(apiDays);
  }

  const apiDaySet = new Set();
  for (const doc of active) {
    const schedule = getScheduleForBranch(doc, bid);
    for (const s of schedule) {
      const n = Number(s.day);
      if (!Number.isNaN(n) && n >= 0 && n <= 6) apiDaySet.add(n);
    }
  }
  return collectIsoDaysForApiDays([...apiDaySet]);
}

/**
 * Visit start times for a doctor at a branch on a given day (includes unavailable).
 * GET /public/slots?doctor_id=&branch_id=&date=
 *
 * @param {string} doctorId
 * @param {string} isoDay — YYYY-MM-DD
 * @param {string | null | undefined} branchId
 * @returns {Promise<Array<{ time: string, available: boolean }>>}
 */
export async function fetchTimeSlotsForDoctorDay(doctorId, isoDay, branchId) {
  const id = String(doctorId ?? '').trim();
  const day = String(isoDay ?? '').trim();
  const bid = String(branchId ?? '').trim();
  if (!id || !day || !bid) return [];

  const { data } = await apiClient.get('/public/slots', {
    params: {
      doctor_id: id,
      branch_id: bid,
      date: day,
    },
  });

  const items = Array.isArray(data?.slots) ? data.slots : [];
  const byTime = new Map();
  for (const s of items) {
    if (!s?.time) continue;
    const rawT = String(s.time).trim();
    if (!rawT) continue;
    const time = rawT.length >= 5 ? rawT.slice(0, 5) : rawT;
    byTime.set(time, { time, available: Boolean(s.available) });
  }
  return [...byTime.values()].sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Map react-hook-form registration values → POST /public/reservations body.
 * @param {Record<string, unknown>} form — firstName, lastName, mobile, age (YYYY-MM-DD), branchId, doctorId, appointmentDay, appointmentTime, medicalNotes
 */
export function mapRegistrationFormToReservationBody(form) {
  const branchId = Number(form?.branchId);
  const doctorIdStr = String(form?.doctorId ?? '').trim();
  const slot = String(form?.appointmentTime ?? '').trim();

  const body = {
    mobile_number: String(form?.mobile ?? '').trim(),
    first_name: String(form?.firstName ?? '').trim(),
    last_name: String(form?.lastName ?? '').trim(),
    date_of_birth: String(form?.age ?? '').trim(),
    branch_id: Number.isFinite(branchId) ? branchId : form?.branchId,
    date_of_visit: String(form?.appointmentDay ?? '').trim(),
    medical_notes: String(form?.medicalNotes ?? '').trim(),
  };

  if (doctorIdStr) {
    const doctorId = Number(doctorIdStr);
    if (Number.isFinite(doctorId)) body.doctor_id = doctorId;
  }
  if (slot) body.slot = slot;

  return body;
}

/**
 * Create a reservation (registration request).
 * POST /public/reservations
 */
export async function submitRegistrationRequest(formValues) {
  const payload = mapRegistrationFormToReservationBody(formValues);
  const { data } = await apiClient.post('/public/reservations', payload);
  return data;
}

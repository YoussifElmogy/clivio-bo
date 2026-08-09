import { doctorCreateDefaultValues } from '../schemas/doctorSchema';
import { withTenantClinicId } from '../config/tenantConfig';
import {
  buildInternationalPhone,
  splitPhoneNumber,
} from '../utils/phoneNumber';

function normalizeTime(value) {
  if (value == null || typeof value !== 'string') return '';
  const t = value.trim();
  return t.length >= 5 ? t.slice(0, 5) : t;
}

function toOptionalNumber(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * API `assigned_branches[].schedule` is a flat list of { day, from_time, to_time }.
 * Form expects days[].slots[] grouped by weekday.
 */
function groupFlatScheduleByDay(schedule) {
  if (!Array.isArray(schedule)) return [];
  const byDay = new Map();
  for (const entry of schedule) {
    const dayNum = Number(entry?.day);
    if (Number.isNaN(dayNum)) continue;
    const slot = {
      from_time: normalizeTime(entry.from_time),
      to_time: normalizeTime(entry.to_time),
    };
    if (!byDay.has(dayNum)) byDay.set(dayNum, []);
    byDay.get(dayNum).push(slot);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, slots]) => ({ day, slots }));
}

function mapAssignedBranchesToForm(assignedBranches) {
  if (!Array.isArray(assignedBranches)) return [];
  return assignedBranches.map(branch => ({
    branch_id: branch.id !== '' && branch.id != null ? Number(branch.id) : '',
    days: groupFlatScheduleByDay(branch.schedule),
  }));
}

function mapBranchSchedulesFromApi(branchSchedules) {
  if (!Array.isArray(branchSchedules)) return [];
  return branchSchedules.map(bs => ({
    branch_id: bs.branch_id !== '' && bs.branch_id != null ? Number(bs.branch_id) : '',
    days: Array.isArray(bs.days)
      ? bs.days.map(d => ({
          day: d.day !== '' && d.day != null ? Number(d.day) : 0,
          slots: Array.isArray(d.slots)
            ? d.slots.map(s => ({
                from_time: normalizeTime(s.from_time),
                to_time: normalizeTime(s.to_time),
              }))
            : [],
        }))
      : [],
  }));
}

/**
 * Maps GET /doctors/:id (or similar) into react-hook-form values.
 */
export function mergeDoctorFromApi(data) {
  if (!data || typeof data !== 'object') {
    return { ...doctorCreateDefaultValues };
  }

  const row = data.doctor && typeof data.doctor === 'object' ? data.doctor : data;

  let branch_schedules = [];
  if (Array.isArray(row.assigned_branches) && row.assigned_branches.length > 0) {
    branch_schedules = mapAssignedBranchesToForm(row.assigned_branches);
  } else if (Array.isArray(row.branch_schedules)) {
    branch_schedules = mapBranchSchedulesFromApi(row.branch_schedules);
  }

  const specialty =
    typeof row.specialty === 'string'
      ? row.specialty
      : row.specialty != null
        ? String(row.specialty)
        : '';

  const active =
    row.is_active !== undefined
      ? Boolean(row.is_active)
      : row.active !== undefined
        ? Boolean(row.active)
        : true;

  const phoneParts = splitPhoneNumber(row.phone);
  const pricePerConsultation = toOptionalNumber(row.price_per_consultation);
  const pricePerExamination = toOptionalNumber(row.price_per_examination);

  return {
    name: typeof row.name === 'string' ? row.name : '',
    email: typeof row.email === 'string' ? row.email : '',
    phone_country_code: phoneParts.countryCode,
    phone: phoneParts.nationalNumber,
    specialty,
    price_per_consultation: pricePerConsultation ?? '',
    price_per_examination: pricePerExamination ?? '',
    password: '',
    active,
    branch_schedules,
  };
}

/**
 * Builds POST /doctors body from form values (create).
 */
export function buildDoctorCreatePayload(values) {
  const payload = buildDoctorWritePayload(values);
  return withTenantClinicId(payload);
}

/** PATCH /doctors/:id — same shape as create, without clinic_id. */
export function buildDoctorUpdatePayload(values) {
  return buildDoctorWritePayload(values);
}

function buildDoctorWritePayload(values) {
  const branch_schedules = (values.branch_schedules ?? [])
    .filter(bs => bs?.branch_id !== '' && bs?.branch_id != null)
    .map(bs => ({
      branch_id: Number(bs.branch_id),
      days: (bs.days ?? []).map(d => ({
        day: Number(d.day),
        slots: (d.slots ?? []).map(s => ({
          from_time: normalizeTime(s.from_time),
          to_time: normalizeTime(s.to_time),
        })),
      })),
    }));

  const specialty = typeof values.specialty === 'string' ? values.specialty.trim() : '';
  const pricePerConsultation = toOptionalNumber(values.price_per_consultation);
  const pricePerExamination = toOptionalNumber(values.price_per_examination);

  const payload = {
    name: values.name.trim(),
    email: values.email.trim(),
    phone: buildInternationalPhone(values.phone_country_code, values.phone),
    specialty,
    ...(pricePerConsultation != null ? { price_per_consultation: pricePerConsultation } : {}),
    ...(pricePerExamination != null ? { price_per_examination: pricePerExamination } : {}),
    is_active: values.active === undefined ? true : Boolean(values.active),
    branch_schedules,
  };
  const pw = typeof values.password === 'string' ? values.password.trim() : '';
  if (pw) payload.password = pw;
  return payload;
}

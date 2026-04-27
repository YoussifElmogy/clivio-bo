import * as yup from 'yup';
import { formatHhmmToAmPm } from '../utils/timeFormat';
import { optionalUserPasswordYup, requiredUserPasswordYup } from './userPasswordSchema';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

function sliceTime(t) {
  if (t == null) return '';
  const s = String(t).trim();
  return s.length >= 5 ? s.slice(0, 5) : s;
}

/**
 * Resolve `{ branch_id, days }` for the current slot field.
 * Leaf string tests may not include the branch block in Yup’s `from` lineage, so we also parse
 * `path` + `context.formValues` (injected by DoctorCreatePage’s resolver wrapper).
 */
function findBranchScheduleBlock(ctx) {
  const from = ctx?.from;
  if (from && Array.isArray(from)) {
    for (let i = from.length - 1; i >= 0; i--) {
      const v = from[i]?.value;
      if (v && typeof v === 'object' && 'branch_id' in v && Array.isArray(v.days)) {
        return v;
      }
    }
  }
  const path = ctx?.path;
  const fv = ctx?.options?.context?.formValues;
  if (typeof path === 'string' && fv && Array.isArray(fv.branch_schedules)) {
    const m = path.match(/^branch_schedules(?:\[(\d+)\]|\.(\d+))/);
    const idx = m ? Number(m[1] ?? m[2]) : NaN;
    if (!Number.isNaN(idx)) {
      const block = fv.branch_schedules[idx];
      if (block && typeof block === 'object' && 'branch_id' in block) return block;
    }
  }
  return null;
}

function getBranchWindow(branches, branchId) {
  const b = (branches ?? []).find(x => Number(x.id) === Number(branchId));
  if (!b) return { bFrom: '', bTo: '' };
  return { bFrom: sliceTime(b.from_time), bTo: sliceTime(b.to_time) };
}

/**
 * @param {unknown[]} branches - loaded branch list (from_time / to_time as HH:mm or strings)
 */
export function createDoctorCreateSchema(branches = [], { requirePassword = false } = {}) {
  const slotSchema = yup.object({
    from_time: yup
      .string()
      .required('From time is required')
      .matches(timeRegex, 'Use HH:mm')
      .test('within-branch-from', function (val) {
        const block = findBranchScheduleBlock(this);
        if (!block?.branch_id) return true;
        const { bFrom, bTo } = getBranchWindow(branches, block.branch_id);
        if (!bFrom || !bTo) return true;
        if (!val || !timeRegex.test(val)) return true;
        if (val < bFrom || val > bTo) {
          return this.createError({
            message: `Must be between ${formatHhmmToAmPm(bFrom)} and ${formatHhmmToAmPm(bTo)}`,
          });
        }
        return true;
      }),
    to_time: yup
      .string()
      .required('To time is required')
      .matches(timeRegex, 'Use HH:mm')
      .test('after-from', 'End must be after start', function (to) {
        const { from_time: from } = this.parent;
        if (!from || !to || !timeRegex.test(from) || !timeRegex.test(to)) return true;
        return to > from;
      })
      .test('within-branch-to', function (val) {
        const block = findBranchScheduleBlock(this);
        if (!block?.branch_id) return true;
        const { bFrom, bTo } = getBranchWindow(branches, block.branch_id);
        if (!bFrom || !bTo) return true;
        if (!val || !timeRegex.test(val)) return true;
        if (val < bFrom || val > bTo) {
          return this.createError({
            message: `Must be between ${formatHhmmToAmPm(bFrom)} and ${formatHhmmToAmPm(bTo)}`,
          });
        }
        return true;
      }),
  });

  const daySchema = yup.object({
    day: yup
      .number()
      .integer()
      .min(0, 'Day 0–6')
      .max(6)
      .required('Pick a day'),
    slots: yup.array().of(slotSchema).min(1, 'Add at least one time range'),
  });

  const branchScheduleSchema = yup.object({
    branch_id: yup
      .mixed()
      .required('Select a branch')
      .test('is-id', 'Select a branch', v => v !== '' && v != null && !Number.isNaN(Number(v))),
    days: yup.array().of(daySchema).min(1, 'Add at least one day for this branch'),
  });

  // Nested `array().of(branchScheduleSchema)` is required so Yup emits paths like
  // `branch_schedules[0].days[0].slots[0].from_time` — the old root `.test()` + validateSync
  // only attached a single error to `branch_schedules`, so nested Controllers never saw errors.
  return yup.object({
    name: yup.string().trim().required('Name is required'),
    email: yup.string().trim().email('Valid email required').required('Email is required'),
    phone: yup.string().trim().required('Phone is required'),
    specialty: yup.string().trim().optional(),
    password: requirePassword ? requiredUserPasswordYup() : optionalUserPasswordYup(),
    active: yup.boolean().optional(),
    branch_schedules: yup.array().of(branchScheduleSchema).optional(),
  });
}

export function initialBranchSchedule() {
  return {
    branch_id: '',
    days: [{ day: 2, slots: [{ from_time: '09:00', to_time: '17:00' }] }],
  };
}

export const doctorCreateDefaultValues = {
  name: '',
  email: '',
  phone: '',
  specialty: '',
  password: '',
  active: true,
  branch_schedules: [],
};

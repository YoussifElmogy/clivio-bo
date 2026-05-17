import * as yup from 'yup';

const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

export const MACHINE_TYPE_OPTIONS = [
  { value: 'pulses', label: 'Pulses' },
  { value: 'duration', label: 'Duration' },
  { value: 'injectables', label: 'Injectables' },
  { value: 'sessions', label: 'Sessions' },
];

const MACHINE_TYPES = ['pulses', 'duration', 'injectables', 'sessions'];

export function normalizeMachineType(type) {
  const t = String(type ?? '')
    .trim()
    .toLowerCase();
  return MACHINE_TYPES.includes(t) ? t : 'sessions';
}

export function machineTypeLabel(type) {
  return (
    MACHINE_TYPE_OPTIONS.find(o => o.value === normalizeMachineType(type))?.label ??
    type ??
    'Machine'
  );
}

export function machineZoneNeedsUsageField(type) {
  const t = normalizeMachineType(type);
  return t === 'duration' || t === 'pulses';
}

export function machineZoneUsageFieldLabel(type) {
  switch (normalizeMachineType(type)) {
    case 'duration':
      return 'Minutes';
    case 'pulses':
      return 'Pulses';
    default:
      return '';
  }
}

/** @returns {{ valid: boolean, message?: string, minutes?: number, pulses?: number }} */
export function parseMachineZoneUsage(type, rawValue) {
  const t = normalizeMachineType(type);
  if (!machineZoneNeedsUsageField(t)) {
    return { valid: true };
  }
  const label = machineZoneUsageFieldLabel(t);
  const trimmed = String(rawValue ?? '').trim();
  if (!trimmed) {
    return { valid: false, message: `${label} is required` };
  }
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) {
    return { valid: false, message: 'Enter a number greater than 0' };
  }
  if (t === 'pulses' && !Number.isInteger(n)) {
    return { valid: false, message: 'Pulses must be a whole number' };
  }
  if (t === 'duration') {
    return { valid: true, minutes: n };
  }
  return { valid: true, pulses: n };
}

export function machinePriceFieldLabel(type) {
  switch (type) {
    case 'pulses':
      return 'Price per pulse';
    case 'duration':
      return 'Price per minute';
    case 'injectables':
      return 'Price';
    case 'sessions':
      return 'Price per session';
    default:
      return 'Price';
  }
}

export const machineDefaultValues = {
  service: '',
  name: '',
  type: 'pulses',
  price: '',
  description: '',
  /** YYYY-MM-DD or '' */
  latest_maintenance_date: '',
};

export const machineSchema = yup.object({
  service: yup
    .mixed()
    .required('Select a service')
    .test('service', 'Select a service', v => v !== '' && v != null && !Number.isNaN(Number(v))),
  name: yup.string().trim().required('Name is required'),
  type: yup
    .string()
    .oneOf(['pulses', 'duration', 'injectables', 'sessions'])
    .required('Type is required'),
  price: yup
    .number()
    .typeError('Price must be a number')
    .moreThan(0, 'Price must be greater than 0')
    .required('Price is required'),
  description: yup.string().optional(),
  latest_maintenance_date: yup
    .string()
    .trim()
    .optional()
    .test('date-or-empty', 'Use a valid date (YYYY-MM-DD)', v => !v || dateOnlyRegex.test(v)),
});

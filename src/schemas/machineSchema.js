import * as yup from 'yup';

export const MACHINE_TYPE_OPTIONS = [
  { value: 'pulses', label: 'Pulses' },
  { value: 'duration', label: 'Duration' },
  { value: 'injectables', label: 'Injectables' },
  { value: 'sessions', label: 'Sessions' },
];

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
});

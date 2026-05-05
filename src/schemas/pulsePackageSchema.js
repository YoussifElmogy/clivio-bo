import * as yup from 'yup';

export const pulsePackageDefaultValues = {
  pulses: '',
  price: '',
  description: '',
};

export const pulsePackageSchema = yup.object({
  pulses: yup
    .number()
    .typeError('Pulses must be a number')
    .integer('Pulses must be a whole number')
    .min(1, 'Pulses must be at least 1')
    .required('Pulses is required'),
  price: yup.string().trim().required('Price is required'),
  description: yup.string().trim().max(20000, 'Description is too long').optional(),
});

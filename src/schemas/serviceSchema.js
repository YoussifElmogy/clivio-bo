import * as yup from 'yup';

export const SERVICE_CATEGORY_OPTIONS = [
  { value: 'injectable', label: 'Injectable' },
  { value: 'machine', label: 'Machine' },
];

export const serviceDefaultValues = {
  name: '',
  category: '',
  description: '',
  clinicFees: '',
};

export const serviceSchema = yup.object({
  name: yup.string().trim().required('Name is required'),
  category: yup
    .string()
    .oneOf(['injectable', 'machine'], 'Select a category')
    .required('Category is required'),
  description: yup.string().optional(),
  clinicFees: yup
    .number()
    .transform((value, originalValue) => {
      if (originalValue === '' || originalValue == null) return undefined;
      return value;
    })
    .typeError('Clinic fees must be a number')
    .min(0, 'Clinic fees must be between 0 and 100')
    .max(100, 'Clinic fees must be between 0 and 100')
    .optional()
    .nullable(),
});

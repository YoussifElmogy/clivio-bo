import * as yup from 'yup';

export const SERVICE_CATEGORY_OPTIONS = [
  { value: 'injectable', label: 'Injectable' },
  { value: 'machine', label: 'Machine' },
];

export const serviceDefaultValues = {
  name: '',
  category: '',
  description: '',
};

export const serviceSchema = yup.object({
  name: yup.string().trim().required('Name is required'),
  category: yup
    .string()
    .oneOf(['injectable', 'machine'], 'Select a category')
    .required('Category is required'),
  description: yup.string().optional(),
});

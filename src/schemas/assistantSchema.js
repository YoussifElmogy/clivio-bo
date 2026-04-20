import * as yup from 'yup';

export const assistantCreateDefaultValues = {
  name: '',
  email: '',
  phone: '',
  branch_id: '',
  active: true,
  role_ids: [],
};

export const assistantCreateSchema = yup.object({
  name: yup.string().trim().required('Name is required'),
  email: yup.string().trim().email('Valid email required').required('Email is required'),
  phone: yup.string().trim().required('Phone is required'),
  branch_id: yup
    .mixed()
    .required('Select a branch')
    .test('branch', 'Select a branch', v => v !== '' && v != null && !Number.isNaN(Number(v))),
  active: yup.boolean(),
  role_ids: yup
    .array()
    .of(yup.number())
    .min(1, 'Select at least one permission'),
});

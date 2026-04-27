import * as yup from 'yup';
import { optionalUserPasswordYup, requiredUserPasswordYup } from './userPasswordSchema';

export const assistantCreateDefaultValues = {
  name: '',
  email: '',
  phone: '',
  branch_id: '',
  password: '',
  role_ids: [],
};

export function createAssistantSchema({ requirePassword = false } = {}) {
  return yup.object({
    name: yup.string().trim().required('Name is required'),
    email: yup.string().trim().email('Valid email required').required('Email is required'),
    phone: yup.string().trim().required('Phone is required'),
    branch_id: yup
      .mixed()
      .required('Select a branch')
      .test('branch', 'Select a branch', v => v !== '' && v != null && !Number.isNaN(Number(v))),
    password: requirePassword ? requiredUserPasswordYup() : optionalUserPasswordYup(),
    role_ids: yup
      .array()
      .of(yup.number())
      .min(1, 'Select at least one permission'),
  });
}

import * as yup from 'yup';

export const branchDefaultValues = {
  name: '',
  phone: '',
  address: '',
  active: true,
};

export const branchSchema = yup.object({
  name: yup.string().trim().required('Name is required'),
  phone: yup.string().trim().required('Phone is required'),
  address: yup.string().trim().required('Address is required'),
  active: yup.boolean(),
});

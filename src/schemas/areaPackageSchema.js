import * as yup from 'yup';

export const areaPackageDefaultValues = {
  name: '',
  price: '',
  description: '',
};

export const areaPackageSchema = yup.object({
  name: yup.string().trim().required('Name is required'),
  price: yup.string().trim().required('Price is required'),
  description: yup.string().trim().max(20000, 'Description is too long').optional(),
});

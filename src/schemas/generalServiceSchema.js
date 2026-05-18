import * as yup from 'yup';

export const generalServiceDefaultValues = {
  doctor: '',
  name: '',
  price: '',
};

export const generalServiceSchema = yup.object({
  doctor: yup
    .mixed()
    .required('Doctor is required')
    .test('doctor-id', 'Doctor is required', v => v !== '' && v != null && !Number.isNaN(Number(v))),
  name: yup.string().trim().required('Name is required'),
  price: yup
    .number()
    .typeError('Price must be a number')
    .moreThan(0, 'Price must be greater than 0')
    .required('Price is required'),
});

import * as yup from 'yup';

export const doctorMedicineDefaultValues = {
  doctor: '',
  name: '',
  concentration: '',
};

export const doctorMedicineSchema = yup.object({
  doctor: yup
    .mixed()
    .required('Select a doctor')
    .test('doctor-id', 'Select a doctor', v => v !== '' && v != null && !Number.isNaN(Number(v))),
  name: yup.string().trim().required('Name is required'),
  concentration: yup.string().trim().required('Concentration is required'),
});

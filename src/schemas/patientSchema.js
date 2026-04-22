import * as yup from 'yup';

const dobRegex = /^\d{4}-\d{2}-\d{2}$/;

export const patientDefaultValues = {
  first_name: '',
  last_name: '',
  mobile_number: '',
  date_of_birth: '',
  medical_notes: '',
};

export const patientSchema = yup.object({
  first_name: yup.string().trim().required('First name is required'),
  last_name: yup.string().trim().required('Last name is required'),
  mobile_number: yup.string().trim().required('Mobile number is required'),
  date_of_birth: yup
    .string()
    .trim()
    .required('Date of birth is required')
    .matches(dobRegex, 'Use YYYY-MM-DD'),
  medical_notes: yup.string().trim().max(20000, 'Notes are too long').optional(),
});

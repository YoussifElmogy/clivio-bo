import * as yup from 'yup';

export const patientAppointmentDefaultValues = {
  patientId: '',
  branchId: '',
  doctorId: '',
  appointmentDay: '',
  appointmentTime: '',
};

export const patientAppointmentSchema = yup.object({
  patientId: yup.string().trim().required('Missing patient'),
  branchId: yup.string().trim().required('Select a branch'),
  doctorId: yup.string().trim().required('Select a doctor'),
  appointmentDay: yup.string().trim().required('Select a preferred day'),
  appointmentTime: yup.string().trim().required('Select a preferred time'),
});

import * as yup from 'yup';
import { RESERVATION_STATUS } from '../constants/reservationStatus';

const statusValues = [
  RESERVATION_STATUS.PENDING,
  RESERVATION_STATUS.CONFIRMED,
  RESERVATION_STATUS.ARRIVED,
  RESERVATION_STATUS.CANCELED,
];

export const reservationEditDefaultValues = {
  branchId: '',
  doctorId: '',
  appointmentDay: '',
  appointmentTime: '',
  status: RESERVATION_STATUS.PENDING,
};

export const reservationEditSchema = yup.object({
  branchId: yup.string().trim().required('Select a branch'),
  doctorId: yup.string().trim().required('Select a doctor'),
  appointmentDay: yup.string().trim().required('Select a preferred day'),
  appointmentTime: yup.string().trim().required('Select a preferred time'),
  status: yup
    .string()
    .trim()
    .oneOf(statusValues, 'Select a valid status')
    .required('Select a status'),
});

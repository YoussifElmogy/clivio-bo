import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { patientAppointmentSchema, patientAppointmentDefaultValues } from '../schemas/patientAppointmentSchema';

export function usePatientAppointmentForm() {
  return useForm({
    resolver: yupResolver(patientAppointmentSchema),
    defaultValues: patientAppointmentDefaultValues,
    mode: 'onTouched',
  });
}

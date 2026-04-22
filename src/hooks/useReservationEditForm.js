import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { reservationEditSchema, reservationEditDefaultValues } from '../schemas/reservationEditSchema';

export function useReservationEditForm() {
  return useForm({
    resolver: yupResolver(reservationEditSchema),
    defaultValues: reservationEditDefaultValues,
    mode: 'onTouched',
  });
}

import React from 'react';
import { reservationStatusLabel } from '../../constants/reservationStatus';
import ReservationStatusChip from './ReservationStatusChip';

export default function ReservationStatusPill({ status }) {
  return <ReservationStatusChip label={reservationStatusLabel(status)} status={status} />;
}

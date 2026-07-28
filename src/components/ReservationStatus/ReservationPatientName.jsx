import React from 'react';
import ReservationStatusChip from './ReservationStatusChip';

export default function ReservationPatientName({ name, status }) {
  return <ReservationStatusChip label={name} status={status} />;
}

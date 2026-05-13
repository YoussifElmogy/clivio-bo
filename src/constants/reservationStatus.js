/** Backend reservation / appointment status values */
export const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  ARRIVED: 'arrived',
  FINISHED: 'finished',
  CANCELED: 'canceled',
};

/** UI dropdown options: value sent to API, label shown to user */
export const RESERVATION_STATUS_OPTIONS = [
  { value: RESERVATION_STATUS.PENDING, label: 'Pending' },
  { value: RESERVATION_STATUS.CONFIRMED, label: 'Confirmed' },
  { value: RESERVATION_STATUS.ARRIVED, label: 'Arrived' },
  { value: RESERVATION_STATUS.FINISHED, label: 'Finished' },
  { value: RESERVATION_STATUS.CANCELED, label: 'Canceled' },
];

export function reservationStatusLabel(value) {
  const v = String(value ?? '').toLowerCase();
  const row = RESERVATION_STATUS_OPTIONS.find(o => o.value === v);
  return row?.label ?? value ?? '—';
}

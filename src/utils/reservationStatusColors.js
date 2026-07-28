import { alpha } from '@mui/material/styles';
import { RESERVATION_STATUS } from '../constants/reservationStatus';

/** Shared status colors for pills, patient names, etc. */
export function getReservationStatusColors(theme, status) {
  const v = String(status ?? '').toLowerCase();
  switch (v) {
    case RESERVATION_STATUS.PENDING:
      return {
        bg: alpha('#eab308', 0.2),
        fg: '#a16207',
      };
    case RESERVATION_STATUS.CONFIRMED:
      return {
        bg: alpha(theme.palette.info.main, 0.16),
        fg: theme.palette.info.dark,
      };
    case RESERVATION_STATUS.ARRIVED:
      return {
        bg: alpha('#9333ea', 0.14),
        fg: '#7e22ce',
      };
    case RESERVATION_STATUS.FINISHED:
      return {
        bg: alpha(theme.palette.success.main, 0.16),
        fg: theme.palette.success.dark,
      };
    case RESERVATION_STATUS.CANCELED:
      return {
        bg: alpha('#dc2626', 0.18),
        fg: '#b91c1c',
      };
    default:
      return {
        bg: alpha(theme.palette.grey[500], 0.12),
        fg: theme.palette.text.secondary,
      };
  }
}

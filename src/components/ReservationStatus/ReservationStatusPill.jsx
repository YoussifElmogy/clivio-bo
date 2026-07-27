import React from 'react';
import Chip from '@mui/material/Chip';
import { alpha, useTheme } from '@mui/material/styles';
import { RESERVATION_STATUS, reservationStatusLabel } from '../../constants/reservationStatus';

function pillColors(theme, status) {
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

export default function ReservationStatusPill({ status }) {
  const theme = useTheme();
  const { bg, fg } = pillColors(theme, status);

  return (
    <Chip
      label={reservationStatusLabel(status)}
      size="small"
      sx={{
        height: 26,
        borderRadius: '999px',
        fontWeight: 700,
        fontSize: '0.75rem',
        letterSpacing: '0.01em',
        bgcolor: bg,
        color: fg,
        border: '1px solid',
        borderColor: alpha(fg, 0.22),
        '& .MuiChip-label': { px: 1.35, py: 0 },
      }}
    />
  );
}

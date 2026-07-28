import React from 'react';
import Chip from '@mui/material/Chip';
import { alpha, useTheme } from '@mui/material/styles';
import { getReservationStatusColors } from '../../utils/reservationStatusColors';

export function reservationStatusChipSx(theme, status) {
  const { bg, fg } = getReservationStatusColors(theme, status);
  return {
    height: 26,
    borderRadius: '999px',
    fontWeight: 700,
    fontSize: '0.75rem',
    letterSpacing: '0.01em',
    bgcolor: bg,
    color: fg,
    border: '1px solid',
    borderColor: alpha(fg, 0.22),
    maxWidth: '100%',
    '& .MuiChip-label': {
      px: 1.35,
      py: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  };
}

export default function ReservationStatusChip({ label, status, title }) {
  const theme = useTheme();
  const display = label != null && String(label).trim() ? String(label).trim() : '—';

  return (
    <Chip
      label={display}
      size="small"
      title={title ?? display}
      sx={reservationStatusChipSx(theme, status)}
    />
  );
}

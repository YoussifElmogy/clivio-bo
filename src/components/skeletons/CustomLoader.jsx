import React from 'react';
import LinearProgress from '@mui/material/LinearProgress';

export default function CustomLoader({ show = false }) {
  if (!show) return null;
  return (
    <LinearProgress
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 2000,
        height: 4,
      }}
    />
  );
}

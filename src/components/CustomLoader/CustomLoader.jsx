import React from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { useTheme } from '@mui/material/styles';

/**
 * Thin indeterminate bar fixed to the top of the viewport when `active` is true.
 * Sits above modals so progress is visible during async actions (e.g. delete).
 */
export default function CustomLoader({ active = false }) {
  const theme = useTheme();

  if (!active) return null;

  return (
    <Box
      role="progressbar"
      aria-label="Loading"
      aria-busy="true"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.modal + 2,
        height: 3,
        pointerEvents: 'none',
      }}
    >
      <LinearProgress
        color="primary"
        sx={{
          height: 3,
          '& .MuiLinearProgress-bar': {
            transition: 'transform 0.2s ease',
          },
        }}
      />
    </Box>
  );
}

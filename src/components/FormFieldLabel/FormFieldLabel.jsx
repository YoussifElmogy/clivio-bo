import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

/** Static label above inputs (no MUI floating label). Required: red asterisk. */
export default function FormFieldLabel({ htmlFor, required, children }) {
  return (
    <Typography
      component="label"
      htmlFor={htmlFor}
      variant="subtitle2"
      sx={{
        display: 'block',
        mb: 1,
        fontWeight: 600,
        color: 'text.primary',
      }}
    >
      {children}
      {required ? (
        <Box component="span" sx={{ color: 'error.main', ml: 0.25 }} aria-hidden>
          *
        </Box>
      ) : null}
    </Typography>
  );
}

import React from 'react';
import Alert from '@mui/material/Alert';

export default function ViewOnlyBanner({ message = 'This appointment is paid — view only.' }) {
  return (
    <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
      {message}
    </Alert>
  );
}

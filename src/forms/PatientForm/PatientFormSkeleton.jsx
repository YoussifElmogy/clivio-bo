import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';

function FieldSkeleton({ labelWidth = 72 }) {
  return (
    <Box sx={{ width: '100%' }}>
      <Skeleton variant="text" width={labelWidth} sx={{ mb: 1 }} />
      <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2 }} />
    </Box>
  );
}

/**
 * Mirrors PatientForm layout while edit data is loading.
 */
export default function PatientFormSkeleton() {
  return (
    <Box aria-busy aria-label="Loading patient form">
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldSkeleton labelWidth={64} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldSkeleton labelWidth={60} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldSkeleton labelWidth={88} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldSkeleton labelWidth={96} />
        </Grid>
        <Grid size={12}>
          <Skeleton variant="text" width={88} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
        <Skeleton variant="rounded" width={160} height={48} sx={{ borderRadius: 2 }} />
      </Box>
    </Box>
  );
}

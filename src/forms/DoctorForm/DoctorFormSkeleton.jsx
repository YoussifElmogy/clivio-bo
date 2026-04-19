import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

function FieldSkeleton({ labelWidth = 100 }) {
  return (
    <Box sx={{ width: '100%' }}>
      <Skeleton variant="text" width={labelWidth} sx={{ mb: 1 }} />
      <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2 }} />
    </Box>
  );
}

/**
 * Mirrors DoctorForm + branch schedules section while branches are loading.
 */
export default function DoctorFormSkeleton() {
  return (
    <Box aria-busy aria-label="Loading doctor form">
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldSkeleton labelWidth={56} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldSkeleton labelWidth={52} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldSkeleton labelWidth={64} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldSkeleton labelWidth={88} />
        </Grid>
        <Grid size={12}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ pt: 0.5 }}>
            <Skeleton variant="rounded" width={42} height={42} sx={{ borderRadius: 1 }} />
            <Skeleton variant="text" width={72} height={28} />
          </Stack>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Skeleton variant="text" width={220} height={32} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="100%" sx={{ maxWidth: 480, mb: 2.5 }} />
        <Skeleton variant="rounded" height={200} sx={{ borderRadius: 2, mb: 2 }} />
        <Skeleton variant="rounded" width={180} height={40} sx={{ borderRadius: 2 }} />
      </Box>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Skeleton variant="rounded" width={160} height={48} sx={{ borderRadius: 2 }} />
      </Box>
    </Box>
  );
}

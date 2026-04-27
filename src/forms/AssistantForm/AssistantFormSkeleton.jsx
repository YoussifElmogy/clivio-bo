import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
function FieldSkeleton({ w = 80 }) {
  return (
    <Box sx={{ width: '100%' }}>
      <Skeleton variant="text" width={w} sx={{ mb: 1 }} />
      <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2 }} />
    </Box>
  );
}

export default function AssistantFormSkeleton() {
  return (
    <Box aria-busy aria-label="Loading assistant form">
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldSkeleton w={56} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldSkeleton w={52} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldSkeleton w={64} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldSkeleton w={72} />
        </Grid>
      </Grid>
      <Box sx={{ mt: 3 }}>
        <Skeleton variant="text" width={200} height={28} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={280} sx={{ borderRadius: 2 }} />
      </Box>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Skeleton variant="rounded" width={160} height={48} sx={{ borderRadius: 2 }} />
      </Box>
    </Box>
  );
}

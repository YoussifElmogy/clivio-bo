import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

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
        <Grid size={12}>
          <Stack direction="row" spacing={1.5} sx={{ pt: 0.5 }}>
            <Skeleton variant="rounded" width={42} height={42} sx={{ borderRadius: 1 }} />
            <Skeleton variant="text" width={72} height={28} />
          </Stack>
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

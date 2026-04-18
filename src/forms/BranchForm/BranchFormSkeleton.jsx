import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';

/**
 * Placeholder layout matching {@link BranchForm} while branch data is loading.
 */
export default function BranchFormSkeleton() {
  return (
    <Box aria-busy aria-label="Loading form">
      <Grid container spacing={2.5}>
        <Grid size={12}>
          <Skeleton variant="rounded" height={56} sx={{ borderRadius: 1 }} />
        </Grid>
        <Grid size={12}>
          <Skeleton variant="rounded" height={56} sx={{ borderRadius: 1 }} />
        </Grid>
        <Grid size={12}>
          <Skeleton variant="rounded" height={120} sx={{ borderRadius: 1 }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Skeleton variant="rounded" height={56} sx={{ borderRadius: 1 }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Skeleton variant="rounded" height={56} sx={{ borderRadius: 1 }} />
        </Grid>
        <Grid size={12}>
          <Skeleton variant="text" width={140} sx={{ mb: 1 }} />
          <Grid container spacing={1}>
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Skeleton variant="rounded" height={36} sx={{ borderRadius: 1 }} />
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Grid size={12}>
          <Skeleton variant="rounded" width={180} height={40} sx={{ borderRadius: 1 }} />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Skeleton variant="rounded" width={160} height={48} sx={{ borderRadius: 2 }} />
      </Box>
    </Box>
  );
}

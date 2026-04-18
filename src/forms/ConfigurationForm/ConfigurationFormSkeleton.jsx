import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';

function FieldBlock({ children }) {
  return <Box sx={{ width: '100%' }}>{children}</Box>;
}

/**
 * Mirrors ConfigurationForm layout while data is loading.
 */
export default function ConfigurationFormSkeleton() {
  return (
    <Box aria-busy aria-label="Loading configuration form">
      <Grid container spacing={2.5}>
        <Grid size={12}>
          <FieldBlock>
            <Skeleton variant="text" width={120} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2 }} />
          </FieldBlock>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FieldBlock>
            <Skeleton variant="text" width={80} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={188} sx={{ borderRadius: 2 }} />
          </FieldBlock>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FieldBlock>
            <Skeleton variant="text" width={140} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={188} sx={{ borderRadius: 2 }} />
          </FieldBlock>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FieldBlock>
            <Skeleton variant="text" width={100} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2 }} />
          </FieldBlock>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FieldBlock>
            <Skeleton variant="text" width={120} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2 }} />
          </FieldBlock>
        </Grid>

        <Grid size={12}>
          <FieldBlock>
            <Skeleton variant="text" width={90} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={88} sx={{ borderRadius: 2 }} />
          </FieldBlock>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FieldBlock>
            <Skeleton variant="text" width={70} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2 }} />
          </FieldBlock>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FieldBlock>
            <Skeleton variant="text" width={90} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2 }} />
          </FieldBlock>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FieldBlock>
            <Skeleton variant="text" width={80} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2 }} />
          </FieldBlock>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FieldBlock>
            <Skeleton variant="text" width={90} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2 }} />
          </FieldBlock>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FieldBlock>
            <Skeleton variant="text" width={80} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2 }} />
          </FieldBlock>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FieldBlock>
            <Skeleton variant="text" width={90} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2 }} />
          </FieldBlock>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 3 }}>
        <Skeleton variant="rounded" width={160} height={48} sx={{ borderRadius: 2 }} />
      </Box>
    </Box>
  );
}

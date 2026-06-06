import React from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import { isChunkLoadError, reloadAfterChunkError } from '../../utils/lazyWithRetry';

function errorMessage(error) {
  if (isRouteErrorResponse(error)) {
    return error.statusText || `Error ${error.status}`;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong while loading this page.';
}

export default function RouteErrorPage() {
  const error = useRouteError();
  const chunkError = isChunkLoadError(error);

  const handleRefresh = () => {
    if (chunkError) {
      reloadAfterChunkError();
      return;
    }
    window.location.reload();
  };

  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Stack spacing={2} alignItems="center" sx={{ maxWidth: 520, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {chunkError ? 'A new version is available' : 'Could not load this page'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {chunkError
            ? 'The app was updated while you were using it. Refresh to load the latest version.'
            : errorMessage(error)}
        </Typography>
        <Button variant="contained" startIcon={<RefreshRounded />} onClick={handleRefresh} sx={{ borderRadius: 2 }}>
          Refresh page
        </Button>
      </Stack>
    </Box>
  );
}

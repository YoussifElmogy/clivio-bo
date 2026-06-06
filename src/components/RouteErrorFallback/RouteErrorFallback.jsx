import React from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import RefreshRounded from '@mui/icons-material/RefreshRounded';

function errorMessage(error) {
  if (isRouteErrorResponse(error)) {
    return error.statusText || error.data || 'Something went wrong.';
  }
  const message = String(error?.message ?? error ?? '').trim();
  if (!message) return 'Something went wrong while loading this page.';
  if (
    message.toLowerCase().includes('failed to fetch dynamically imported module') ||
    message.toLowerCase().includes('importing a module script failed')
  ) {
    return 'A new version of the app is available. Refresh to load the latest pages.';
  }
  return message;
}

export default function RouteErrorFallback() {
  const error = useRouteError();
  const message = errorMessage(error);

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
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 3, sm: 4 },
          maxWidth: 480,
          width: '100%',
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <Stack spacing={2.5} alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Could not load this page
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshRounded />}
            onClick={() => window.location.reload()}
            sx={{ borderRadius: 2 }}
          >
            Refresh page
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

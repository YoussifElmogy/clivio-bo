import React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';



/**
 * Centers page content in the main layout with consistent padding, title, and surface.
 * Use for settings forms, wizards, or any view that should read as a focused panel.
 */
export default function FormPageShell({
  title,
  description,
  children,
  headerAction = null,
  maxWidth = 'lg',
  paperSx = {},
}) {
  return (
    <Box
      sx={{
        width: '100%',
        mx: 'auto',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          ...paperSx,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'flex-start' },
            justifyContent: 'space-between',
            gap: 2,
            mb: description || headerAction ? 2.5 : 3,
          }}
        >
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
              {title}
            </Typography>
            {description ? (
              <Typography variant="body2" color="text.secondary" >
                {description}
              </Typography>
            ) : null}
          </Box>
          {headerAction ? (
            <Box sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'center' } }}>
              {headerAction}
            </Box>
          ) : null}
        </Box>
        {children}
      </Paper>
    </Box>
  );
}

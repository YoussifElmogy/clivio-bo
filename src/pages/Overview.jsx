import React from 'react';
import { Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import LocalHospitalRounded from '@mui/icons-material/LocalHospitalRounded';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import { useAuth } from '../context/AuthContext';
import { isDoctorUser } from '../utils/authRoles';

const statPlaceholders = [
  {
    title: "Today's visits",
    value: '—',
    Icon: EventAvailableOutlined,
  },
  {
    title: 'Active staff',
    value: '—',
    Icon: GroupsOutlined,
  },
  {
    title: 'Clinic status',
    value: 'Operational',
    Icon: LocalHospitalRounded,
  },
];

export default function Overview() {
  const { user } = useAuth();
  if (isDoctorUser(user)) return <Navigate to="/appointments" replace />;
  const name = user?.fullName || user?.username || 'there';

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: theme =>
            `linear-gradient(120deg, rgba(15, 118, 110, 0.08) 0%, ${theme.palette.background.paper} 55%)`,
        }}
      >
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
          Hello, {name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here is a quick snapshot of your clinic workspace. Connect your API to
          show live metrics.
        </Typography>
      </Paper>

      <Grid container spacing={2}>
        {statPlaceholders.map(({ title, value, Icon }) => (
          <Grid key={title} size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                height: '100%',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: 'rgba(15, 118, 110, 0.1)',
                  color: 'primary.main',
                  display: 'flex',
                }}
              >
                <Icon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                  {title}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {value}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

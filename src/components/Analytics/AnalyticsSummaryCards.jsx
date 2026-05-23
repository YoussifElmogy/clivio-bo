import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import CheckCircleOutlineOutlined from '@mui/icons-material/CheckCircleOutlineOutlined';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import HourglassEmptyOutlined from '@mui/icons-material/HourglassEmptyOutlined';
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';
import LoginOutlined from '@mui/icons-material/LoginOutlined';
import PendingActionsOutlined from '@mui/icons-material/PendingActionsOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import { formatAnalyticsMoney } from '../../payloads/analyticsPayload';

function SummaryCard({ title, value, subtitle, icon: Icon, accent, featured = false, loading }) {
  const theme = useTheme();
  const color = accent ?? theme.palette.primary.main;

  if (loading) {
    return (
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
        <Skeleton variant="rounded" width={44} height={44} sx={{ mb: 1.5 }} />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" height={36} />
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: featured ? 2.75 : 2.25,
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: alpha(color, 0.22),
        background: `linear-gradient(145deg, ${alpha(color, featured ? 0.14 : 0.08)} 0%, ${theme.palette.background.paper} 72%)`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 12px 32px ${alpha(color, 0.12)}`,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.6 }}>
            {title}
          </Typography>
          <Typography
            variant={featured ? 'h4' : 'h5'}
            sx={{ fontWeight: 800, mt: 0.75, lineHeight: 1.15, color: 'text.primary' }}
          >
            {value}
          </Typography>
          {subtitle ? (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        <Box
          sx={{
            width: featured ? 52 : 44,
            height: featured ? 52 : 44,
            borderRadius: 2.5,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(color, 0.12),
            color,
          }}
        >
          <Icon sx={{ fontSize: featured ? 28 : 24 }} />
        </Box>
      </Box>
    </Paper>
  );
}

export default function AnalyticsSummaryCards({ overview, loading }) {
  const theme = useTheme();
  const data = overview ?? {};

  const cards = [
    {
      title: 'Total revenue',
      value: formatAnalyticsMoney(data.total_revenue),
      subtitle: 'Collected in period',
      icon: TrendingUpOutlined,
      accent: theme.palette.success.main,
      featured: true,
    },
    {
      title: 'Pending revenue',
      value: formatAnalyticsMoney(data.pending_revenue),
      subtitle: 'Awaiting payment',
      icon: PendingActionsOutlined,
      accent: '#d97706',
      featured: true,
    },
    {
      title: 'Total patients',
      value: data.total_patients?.toLocaleString() ?? '0',
      subtitle: 'Unique patients',
      icon: GroupsOutlined,
      accent: theme.palette.info.main,
      featured: true,
    },
    {
      title: 'Reservations',
      value: data.total_reservations?.toLocaleString() ?? '0',
      icon: EventAvailableOutlined,
      accent: theme.palette.primary.main,
    },
    {
      title: 'Finished',
      value: data.finished?.toLocaleString() ?? '0',
      icon: CheckCircleOutlineOutlined,
      accent: '#0d9488',
    },
    {
      title: 'Pending',
      value: data.pending?.toLocaleString() ?? '0',
      icon: HourglassEmptyOutlined,
      accent: '#d97706',
    },
    {
      title: 'Confirmed',
      value: data.confirmed?.toLocaleString() ?? '0',
      icon: VerifiedOutlined,
      accent: '#2563eb',
    },
    {
      title: 'Arrived',
      value: data.arrived?.toLocaleString() ?? '0',
      icon: LoginOutlined,
      accent: '#7c3aed',
    },
    {
      title: 'Canceled',
      value: data.canceled?.toLocaleString() ?? '0',
      icon: CancelOutlined,
      accent: theme.palette.error.main,
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {cards.map((card, i) => (
        <Grid key={card.title} size={{ xs: 12, sm: 6, md: i < 3 ? 4 : 4, lg: i < 3 ? 4 : 3 }}>
          <SummaryCard {...card} loading={loading} />
        </Grid>
      ))}
    </Grid>
  );
}

import React from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import EmojiEventsOutlined from '@mui/icons-material/EmojiEventsOutlined';
import { alpha, useTheme } from '@mui/material/styles';
import AnalyticsChartCard from './AnalyticsChartCard';

const RANK_COLORS = ['#f59e0b', '#94a3b8', '#b45309'];

function RankBadge({ rank }) {
  const theme = useTheme();
  const isTop = rank <= 3;
  const color = isTop ? RANK_COLORS[rank - 1] : theme.palette.text.secondary;

  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: '0.9rem',
        bgcolor: isTop ? alpha(color, 0.15) : 'action.hover',
        color,
        flexShrink: 0,
      }}
    >
      {isTop ? <EmojiEventsOutlined sx={{ fontSize: 20 }} /> : rank}
    </Box>
  );
}

function DoctorRow({ doctor, loading }) {
  const theme = useTheme();

  if (loading) {
    return <Skeleton variant="rounded" height={72} sx={{ borderRadius: 2 }} />;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: doctor.rank <= 3 ? alpha(RANK_COLORS[doctor.rank - 1] ?? theme.palette.primary.main, 0.35) : 'divider',
        bgcolor: doctor.rank === 1 ? alpha('#f59e0b', 0.04) : 'background.paper',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <RankBadge rank={doctor.rank} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>
            {doctor.doctor_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {doctor.finished} finished · {doctor.total_reservations} total
          </Typography>
          <LinearProgress
            variant="determinate"
            value={doctor.completionRate}
            sx={{
              mt: 1.25,
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                bgcolor: theme.palette.primary.main,
              },
            }}
          />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', flexShrink: 0 }}>
          {doctor.completionRate}%
        </Typography>
      </Stack>
    </Paper>
  );
}

export default function AnalyticsDoctorsLeaderboard({ doctors = [], loading }) {
  return (
    <AnalyticsChartCard
      title="Top doctors"
      subtitle="Ranked by total reservations in the selected period"
      loading={loading}
      height="auto"
    >
      {!loading && !doctors.length ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No doctor activity in this period.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {(loading ? Array.from({ length: 4 }, (_, i) => ({ rank: i + 1 })) : doctors).map(row => (
            <DoctorRow key={row.doctor_id ?? row.rank} doctor={row} loading={loading} />
          ))}
        </Stack>
      )}
    </AnalyticsChartCard>
  );
}

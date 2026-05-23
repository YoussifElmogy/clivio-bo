import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AnalyticsChartCard from './AnalyticsChartCard';
import { statusChartColor } from '../../payloads/analyticsPayload';

function StatusTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <Box
      sx={{
        px: 1.5,
        py: 1,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 4,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {row.label}
      </Typography>
      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
        {row.count} reservations
      </Typography>
    </Box>
  );
}

const CHART_AREA_HEIGHT = 300;

export default function AnalyticsReservationsCharts({ byStatus = [], daily = [], loading }) {
  const theme = useTheme();
  const totalStatus = useMemo(
    () => byStatus.reduce((sum, row) => sum + row.count, 0),
    [byStatus]
  );

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid size={{ xs: 12, md: 5 }}>
        <AnalyticsChartCard
          title="By status"
          subtitle="Share of reservations per status"
          loading={loading}
          height={300}
        >
          {!loading && !byStatus.length ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: CHART_AREA_HEIGHT,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No status breakdown available.
              </Typography>
            </Box>
          ) : !loading ? (
            <Box
              sx={{
                height: CHART_AREA_HEIGHT,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byStatus}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={100}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {byStatus.map(entry => (
                        <Cell key={entry.status} fill={statusChartColor(entry.status)} />
                      ))}
                    </Pie>
                    <Tooltip content={<StatusTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              {totalStatus > 0 ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', textAlign: 'center', pb: 0.5 }}
                >
                  {totalStatus.toLocaleString()} total in period
                </Typography>
              ) : null}
            </Box>
          ) : null}
        </AnalyticsChartCard>
      </Grid>
      <Grid size={{ xs: 12, md: 7 }}>
        <AnalyticsChartCard
          title="Daily volume"
          subtitle="New reservations per day"
          loading={loading}
          height={300}
        >
          {!loading && !daily.length ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: CHART_AREA_HEIGHT,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No daily reservation data.
              </Typography>
            </Box>
          ) : !loading ? (
            <ResponsiveContainer width="100%" height={CHART_AREA_HEIGHT}>
              <BarChart data={daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: theme.palette.action.hover }}
                  formatter={value => [value, 'Reservations']}
                />
                <Bar dataKey="count" fill={theme.palette.primary.main} radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </AnalyticsChartCard>
      </Grid>
    </Grid>
  );
}

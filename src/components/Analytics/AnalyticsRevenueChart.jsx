import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AnalyticsChartCard from './AnalyticsChartCard';
import { formatAnalyticsMoney } from '../../payloads/analyticsPayload';

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
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
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
        {formatAnalyticsMoney(payload[0].value)}
      </Typography>
    </Box>
  );
}

const CHART_HEIGHT = 340;

export default function AnalyticsRevenueChart({ data = [], loading }) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const hasData = data.length > 0;

  return (
    <AnalyticsChartCard
      title="Revenue trend"
      subtitle="Daily revenue across the selected period"
      loading={loading}
      height={CHART_HEIGHT}
    >
      {!loading && !hasData ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: CHART_HEIGHT,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No revenue data for this period.
          </Typography>
        </Box>
      ) : !loading ? (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={primary} stopOpacity={0.35} />
                <stop offset="100%" stopColor={primary} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${Number(v).toLocaleString()}`}
            />
            <Tooltip content={<RevenueTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={primary}
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              dot={{ r: 3, fill: primary, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: primary }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : null}
    </AnalyticsChartCard>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import InsightsOutlined from '@mui/icons-material/InsightsOutlined';
import dayjs from 'dayjs';
import useApi from '../configs/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isDoctorUser } from '../utils/authRoles';
import { parsePaginatedList } from '../utils/parsePaginatedList';
import AnalyticsFilters from '../components/Analytics/AnalyticsFilters';
import AnalyticsSummaryCards from '../components/Analytics/AnalyticsSummaryCards';
import AnalyticsRevenueChart from '../components/Analytics/AnalyticsRevenueChart';
import AnalyticsReservationsCharts from '../components/Analytics/AnalyticsReservationsCharts';
import AnalyticsDoctorsLeaderboard from '../components/Analytics/AnalyticsDoctorsLeaderboard';
import {
  ANALYTICS_BRANCH_FILTER_ALL,
  buildAnalyticsQuery,
  defaultAnalyticsDateRange,
  normalizeDoctorsAnalytics,
  normalizeOverviewAnalytics,
  normalizeReservationsAnalytics,
  normalizeRevenueAnalytics,
} from '../payloads/analyticsPayload';

function applyDatePreset(preset) {
  const end = dayjs();
  if (preset.ytd) {
    return {
      startDate: end.startOf('year').format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
    };
  }
  const days = preset.days ?? 30;
  return {
    startDate: end.subtract(days, 'day').format('YYYY-MM-DD'),
    endDate: end.format('YYYY-MM-DD'),
  };
}

export default function Overview() {
  const { user } = useAuth();
  const { get } = useApi();
  const { showError } = useToast();

  const defaults = useMemo(() => defaultAnalyticsDateRange(), []);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [branchId, setBranchId] = useState(ANALYTICS_BRANCH_FILTER_ALL);
  const [branchOptions, setBranchOptions] = useState([]);

  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [reservations, setReservations] = useState({ by_status: [], daily: [] });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const name = user?.fullName || user?.username || 'there';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await get('/branches?page=1&page_size=100');
        if (cancelled) return;
        const { rows } = parsePaginatedList(data, { listKeys: ['branches'] });
        setBranchOptions(rows);
      } catch {
        if (!cancelled) setBranchOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAnalytics = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    const query = buildAnalyticsQuery({ startDate, endDate, branchId });
    try {
      const [overviewRes, revenueRes, reservationsRes, doctorsRes] = await Promise.all([
        get(`/analytics/overview?${query}`),
        get(`/analytics/revenue?${query}`),
        get(`/analytics/reservations?${query}`),
        get(`/analytics/doctors?${query}`),
      ]);
      setOverview(normalizeOverviewAnalytics(overviewRes));
      setRevenue(normalizeRevenueAnalytics(revenueRes));
      setReservations(normalizeReservationsAnalytics(reservationsRes));
      setDoctors(normalizeDoctorsAnalytics(doctorsRes));
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not load analytics.';
      showError(typeof msg === 'string' ? msg : 'Could not load analytics.');
      setOverview(null);
      setRevenue([]);
      setReservations({ by_status: [], daily: [] });
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [branchId, endDate, showError, startDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handlePreset = useCallback(preset => {
    const next = applyDatePreset(preset);
    setStartDate(next.startDate);
    setEndDate(next.endDate);
  }, []);

  const periodLabel = useMemo(() => {
    if (!startDate || !endDate) return '';
    return `${dayjs(startDate).format('MMM D, YYYY')} – ${dayjs(endDate).format('MMM D, YYYY')}`;
  }, [startDate, endDate]);

  if (isDoctorUser(user)) return <Navigate to="/appointments" replace />;

  return (
    <Box sx={{ pb: 4 }}>
      HAMMO yel3ab
      <Box
        sx={{
          mb: 3,
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          background: theme =>
            `linear-gradient(125deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 42%, #0f172a 100%)`,
          color: 'primary.contrastText',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            right: -40,
            top: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.08)',
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Chip
            icon={<InsightsOutlined sx={{ color: 'inherit !important' }} />}
            label="Clinic analytics"
            size="small"
            sx={{
              mb: 1.5,
              fontWeight: 700,
              bgcolor: 'rgba(255,255,255,0.15)',
              color: 'inherit',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 0.75 }}>
            Welcome back, {name}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 560 }}>
            Track revenue, reservations, and doctor performance across your clinic network.
          </Typography>
          {periodLabel ? (
            <Typography variant="body2" sx={{ mt: 1.5, opacity: 0.75 }}>
              Showing data for {periodLabel}
            </Typography>
          ) : null}
        </Box>
      </Box>

      <AnalyticsFilters
        startDate={startDate}
        endDate={endDate}
        branchId={branchId}
        branchOptions={branchOptions}
        loading={loading}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onBranchChange={setBranchId}
        onPreset={handlePreset}
      />

      <AnalyticsSummaryCards overview={overview} loading={loading} />

      <Box sx={{ mb: 3 }}>
        <AnalyticsRevenueChart data={revenue} loading={loading} />
      </Box>

      <AnalyticsReservationsCharts
        byStatus={reservations.by_status}
        daily={reservations.daily}
        loading={loading}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <AnalyticsDoctorsLeaderboard doctors={doctors} loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          {!loading && reservations.by_status.length > 0 ? (
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                Status legend
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {reservations.by_status.map(row => (
                  <Box
                    component="li"
                    key={row.status}
                    sx={{ mb: 1.25, color: 'text.secondary', fontSize: '0.9rem' }}
                  >
                    <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {row.label}
                    </Box>
                    {' — '}
                    {row.count.toLocaleString()} (
                    {reservations.by_status.reduce((s, x) => s + x.count, 0) > 0
                      ? Math.round(
                          (row.count / reservations.by_status.reduce((s, x) => s + x.count, 0)) * 100
                        )
                      : 0}
                    %)
                  </Box>
                ))}
              </Box>
            </Box>
          ) : null}
        </Grid>
      </Grid>
    </Box>
  );
}

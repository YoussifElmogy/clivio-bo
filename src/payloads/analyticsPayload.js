import dayjs from 'dayjs';
import { reservationStatusLabel } from '../constants/reservationStatus';

export const ANALYTICS_BRANCH_FILTER_ALL = 'all';

export function defaultAnalyticsDateRange() {
  const end = dayjs();
  const start = end.subtract(30, 'day');
  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: end.format('YYYY-MM-DD'),
  };
}

export function buildAnalyticsQuery({ startDate, endDate, branchId }) {
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);
  const branchKey =
    branchId != null && branchId !== '' && String(branchId) !== ANALYTICS_BRANCH_FILTER_ALL
      ? String(branchId)
      : '';
  if (branchKey) params.set('branch_id', branchKey);
  return params.toString();
}

export function formatAnalyticsMoney(value, currency = 'EGP') {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

export function parseAnalyticsNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeOverviewAnalytics(data) {
  const row = data && typeof data === 'object' ? data : {};
  return {
    total_reservations: parseAnalyticsNumber(row.total_reservations),
    finished: parseAnalyticsNumber(row.finished),
    canceled: parseAnalyticsNumber(row.canceled),
    pending: parseAnalyticsNumber(row.pending),
    confirmed: parseAnalyticsNumber(row.confirmed),
    arrived: parseAnalyticsNumber(row.arrived),
    total_revenue: row.total_revenue ?? '0',
    pending_revenue: row.pending_revenue ?? '0',
    total_patients: parseAnalyticsNumber(row.total_patients),
  };
}

function extractAnalyticsSeries(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.series)) return data.series;
  if (data.data && typeof data.data === 'object' && Array.isArray(data.data.data)) {
    return data.data.data;
  }
  return [];
}

export function normalizeRevenueAnalytics(data) {
  const list = extractAnalyticsSeries(data);
  return list.map(point => ({
    date: point.date ?? '',
    label: point.date ? dayjs(point.date).format('MMM D') : '',
    revenue: parseAnalyticsNumber(point.revenue),
  }));
}

export function normalizeReservationsAnalytics(data) {
  const row = data && typeof data === 'object' ? data : {};
  const by_status = (Array.isArray(row.by_status) ? row.by_status : []).map(item => ({
    status: String(item.status ?? '').toLowerCase(),
    label: reservationStatusLabel(item.status),
    count: parseAnalyticsNumber(item.count),
  }));
  const daily = (Array.isArray(row.daily) ? row.daily : []).map(item => ({
    date: item.date ?? '',
    label: item.date ? dayjs(item.date).format('MMM D') : '',
    count: parseAnalyticsNumber(item.count),
  }));
  return { by_status, daily };
}

export function normalizeDoctorsAnalytics(data) {
  const list = Array.isArray(data?.doctors) ? data.doctors : [];
  return list.map((d, index) => ({
    rank: index + 1,
    doctor_id: d.doctor_id,
    doctor_name: d.doctor_name?.trim() || `Doctor #${d.doctor_id}`,
    total_reservations: parseAnalyticsNumber(d.total_reservations),
    finished: parseAnalyticsNumber(d.finished),
    completionRate:
      parseAnalyticsNumber(d.total_reservations) > 0
        ? Math.round(
            (parseAnalyticsNumber(d.finished) / parseAnalyticsNumber(d.total_reservations)) * 100
          )
        : 0,
  }));
}

/** Status → chart color (matches clinic semantic colors). */
export const ANALYTICS_STATUS_COLORS = {
  finished: '#0d9488',
  canceled: '#dc2626',
  pending: '#d97706',
  confirmed: '#2563eb',
  arrived: '#7c3aed',
};

export function statusChartColor(status) {
  const key = String(status ?? '').toLowerCase();
  return ANALYTICS_STATUS_COLORS[key] ?? '#64748b';
}

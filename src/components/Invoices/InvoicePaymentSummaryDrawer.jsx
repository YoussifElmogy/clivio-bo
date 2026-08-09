import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import useApi from '../../configs/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import usePermissions from '../../hooks/usePermissions';
import { hasLimitedInvoicePaymentInfo } from '../../utils/invoicesAccess';
import { isTenantPaymentInfoEnabled } from '../../config/tenantFeatures';
import {
  DOCTOR_FILTER_ALL,
  doctorSelectOptions,
  fetchAllDoctors,
} from '../../utils/doctorsCatalog';
import {
  buildInvoiceDailySummaryQuery,
  defaultInvoiceSummaryDateRange,
  filterInvoiceSummaryBreakdown,
  formatInvoiceMoney,
  formatInvoiceSummaryDateLabel,
  INVOICE_DAILY_SUMMARY_URL,
  INVOICE_PAYMENT_TYPE_FILTER_ALL,
  INVOICE_PAYMENT_TYPE_FILTER_OPTIONS,
  invoiceSummaryDisplayTotal,
  normalizeInvoiceDailySummary,
  restrictedInvoiceSummaryDateRange,
} from '../../payloads/invoicePayload';

function SummaryRow({ label, value, highlight = false }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
      sx={{
        py: 1,
        px: 0.25,
        ...(highlight
          ? {
              mt: 0.5,
              pt: 1.5,
              borderTop: theme => `1px solid ${theme.palette.divider}`,
            }
          : {}),
      }}
    >
      <Typography variant="body2" color={highlight ? 'text.primary' : 'text.secondary'}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: highlight ? 700 : 600 }}>
        {value}
      </Typography>
    </Stack>
  );
}

/**
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function InvoicePaymentSummaryDrawer({ open, onClose }) {
  const { user } = useAuth();
  const { can } = usePermissions();
  const { get } = useApi();
  const { showError } = useToast();

  const limitedPaymentInfoDates = useMemo(
    () => hasLimitedInvoicePaymentInfo(user, can),
    [user, can]
  );

  const showGeneralServiceFees = isTenantPaymentInfoEnabled();

  const initialRange = useMemo(
    () =>
      limitedPaymentInfoDates
        ? restrictedInvoiceSummaryDateRange()
        : defaultInvoiceSummaryDateRange(),
    [limitedPaymentInfoDates]
  );

  const dateBounds = useMemo(() => {
    if (!limitedPaymentInfoDates) return null;
    const range = restrictedInvoiceSummaryDateRange();
    return {
      min: dayjs(range.dateFrom),
      max: dayjs(range.dateTo),
      range,
    };
  }, [limitedPaymentInfoDates]);

  const [dateFrom, setDateFrom] = useState(initialRange.dateFrom);
  const [dateTo, setDateTo] = useState(initialRange.dateTo);
  const [doctorId, setDoctorId] = useState(DOCTOR_FILTER_ALL);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState(INVOICE_PAYMENT_TYPE_FILTER_ALL);
  const [catalogDoctors, setCatalogDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const doctorOptions = useMemo(
    () => doctorSelectOptions(catalogDoctors, 'all'),
    [catalogDoctors]
  );

  const resetFilters = useCallback(() => {
    setDateFrom('');
    setDateTo('');
    setDoctorId(DOCTOR_FILTER_ALL);
    setPaymentTypeFilter(INVOICE_PAYMENT_TYPE_FILTER_ALL);
  }, []);

  const clampSummaryDate = useCallback(
    iso => {
      const key = String(iso ?? '').trim();
      if (!key || !dateBounds) return key;
      const d = dayjs(key);
      if (!d.isValid()) return key;
      if (d.isBefore(dateBounds.min, 'day')) return dateBounds.min.format('YYYY-MM-DD');
      if (d.isAfter(dateBounds.max, 'day')) return dateBounds.max.format('YYYY-MM-DD');
      return key;
    },
    [dateBounds]
  );

  const fetchSummary = useCallback(
    async (from, to, doctor) => {
      let fromKey = String(from ?? '').trim();
      let toKey = String(to ?? '').trim();
      const doctorKey = String(doctor ?? '').trim();

      if (limitedPaymentInfoDates) {
        const range = restrictedInvoiceSummaryDateRange();
        fromKey = fromKey ? clampSummaryDate(fromKey) : range.dateFrom;
        toKey = toKey ? clampSummaryDate(toKey) : range.dateTo;
      }

      if ((fromKey && !toKey) || (!fromKey && toKey)) {
        showError('Select both date from and date to, or clear both.');
        return;
      }
      if (fromKey && toKey && dayjs(fromKey).isAfter(dayjs(toKey))) {
        showError('Date from must be on or before date to.');
        return;
      }

      setLoading(true);
      try {
        const query = buildInvoiceDailySummaryQuery({
          dateFrom: fromKey,
          dateTo: toKey,
          doctorId: doctorKey,
        });
        const url = query
          ? `${INVOICE_DAILY_SUMMARY_URL}?${query}`
          : INVOICE_DAILY_SUMMARY_URL;
        const data = await get(url);
        setSummary(normalizeInvoiceDailySummary(data));
      } catch (err) {
        const msg =
          err?.detail ||
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          'Could not load payment summary.';
        showError(typeof msg === 'string' ? msg : 'Could not load payment summary.');
        setSummary(null);
      } finally {
        setLoading(false);
      }
    },
    [get, showError, limitedPaymentInfoDates, clampSummaryDate]
  );

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    (async () => {
      setDoctorsLoading(true);
      try {
        const doctorsRows = await fetchAllDoctors(get);
        if (!cancelled) setCatalogDoctors(doctorsRows);
      } catch {
        if (!cancelled) setCatalogDoctors([]);
      } finally {
        if (!cancelled) setDoctorsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const range = limitedPaymentInfoDates
      ? restrictedInvoiceSummaryDateRange()
      : defaultInvoiceSummaryDateRange();
    setDateFrom(range.dateFrom);
    setDateTo(range.dateTo);
    setDoctorId(DOCTOR_FILTER_ALL);
    setPaymentTypeFilter(INVOICE_PAYMENT_TYPE_FILTER_ALL);
    fetchSummary(range.dateFrom, range.dateTo, DOCTOR_FILTER_ALL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, limitedPaymentInfoDates]);

  const handleApply = () => {
    const nextFrom = clampSummaryDate(dateFrom);
    const nextTo = clampSummaryDate(dateTo);
    if (nextFrom !== dateFrom) setDateFrom(nextFrom);
    if (nextTo !== dateTo) setDateTo(nextTo);
    fetchSummary(nextFrom, nextTo, doctorId);
  };

  const handleClearFilters = () => {
    if (limitedPaymentInfoDates) {
      const range = restrictedInvoiceSummaryDateRange();
      setDateFrom(range.dateFrom);
      setDateTo(range.dateTo);
      setDoctorId(DOCTOR_FILTER_ALL);
      setPaymentTypeFilter(INVOICE_PAYMENT_TYPE_FILTER_ALL);
      fetchSummary(range.dateFrom, range.dateTo, DOCTOR_FILTER_ALL);
      return;
    }
    resetFilters();
    setSummary(null);
    fetchSummary('', '', DOCTOR_FILTER_ALL);
  };

  const filteredBreakdown = useMemo(
    () => filterInvoiceSummaryBreakdown(summary?.breakdown, paymentTypeFilter),
    [summary?.breakdown, paymentTypeFilter]
  );

  const displayTotal = useMemo(
    () => invoiceSummaryDisplayTotal(summary, paymentTypeFilter),
    [summary, paymentTypeFilter]
  );

  const rangeLabel =
    summary?.date_from && summary?.date_to
      ? `${formatInvoiceSummaryDateLabel(summary.date_from)} – ${formatInvoiceSummaryDateLabel(summary.date_to)}`
      : '—';

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Stack sx={{ width: { xs: '100vw', sm: 420 }, p: 2.5, gap: 2, height: '100%' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Payment info
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Daily payment totals by type for the selected date range.
          </Typography>
        </Box>

        <Stack spacing={1.5}>
          <DatePicker
            label="Date from"
            value={dateFrom && dayjs(dateFrom).isValid() ? dayjs(dateFrom) : null}
            onChange={v => {
              if (!v?.isValid?.()) {
                if (limitedPaymentInfoDates) {
                  setDateFrom(dateBounds?.range.dateFrom ?? restrictedInvoiceSummaryDateRange().dateFrom);
                } else {
                  setDateFrom('');
                }
                return;
              }
              setDateFrom(clampSummaryDate(v.format('YYYY-MM-DD')));
            }}
            disabled={loading}
            minDate={dateBounds?.min}
            maxDate={
              dateBounds?.max ??
              (dateTo && dayjs(dateTo).isValid() ? dayjs(dateTo) : undefined)
            }
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />
          <DatePicker
            label="Date to"
            value={dateTo && dayjs(dateTo).isValid() ? dayjs(dateTo) : null}
            onChange={v => {
              if (!v?.isValid?.()) {
                if (limitedPaymentInfoDates) {
                  setDateTo(dateBounds?.range.dateTo ?? restrictedInvoiceSummaryDateRange().dateTo);
                } else {
                  setDateTo('');
                }
                return;
              }
              setDateTo(clampSummaryDate(v.format('YYYY-MM-DD')));
            }}
            disabled={loading}
            minDate={
              dateBounds?.min ??
              (dateFrom && dayjs(dateFrom).isValid() ? dayjs(dateFrom) : undefined)
            }
            maxDate={dateBounds?.max}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />
          <FormControl size="small" fullWidth disabled={loading || doctorsLoading}>
            <InputLabel id="payment-summary-doctor-label">Doctor</InputLabel>
            <Select
              labelId="payment-summary-doctor-label"
              label="Doctor"
              value={doctorId}
              onChange={e => setDoctorId(e.target.value)}
            >
              <MenuItem value={DOCTOR_FILTER_ALL}>
                <em>All doctors</em>
              </MenuItem>
              {doctorOptions.map(d => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth disabled={loading}>
            <InputLabel id="payment-summary-type-label">Payment type</InputLabel>
            <Select
              labelId="payment-summary-type-label"
              label="Payment type"
              value={paymentTypeFilter}
              onChange={e => setPaymentTypeFilter(e.target.value)}
            >
              {INVOICE_PAYMENT_TYPE_FILTER_OPTIONS.map(o => (
                <MenuItem key={String(o.value)} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={handleApply} disabled={loading} sx={{ borderRadius: 2 }}>
              Apply
            </Button>
            <Button variant="outlined" onClick={handleClearFilters} disabled={loading} sx={{ borderRadius: 2 }}>
              Clear filters
            </Button>
          </Stack>
        </Stack>

        <Divider />

        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ pt: 6 }}>
              <CircularProgress size={32} />
            </Stack>
          ) : !summary ? (
            <Typography variant="body2" color="text.secondary">
              No payment data for this range.
            </Typography>
          ) : (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Period: <strong>{rangeLabel}</strong>
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                {filteredBreakdown.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No payments for the selected type in this period.
                  </Typography>
                ) : (
                  filteredBreakdown.map(row => (
                    <SummaryRow
                      key={row.payment_type}
                      label={row.payment_type_label}
                      value={formatInvoiceMoney(row.total)}
                    />
                  ))
                )}
                <SummaryRow
                  label="Total"
                  value={formatInvoiceMoney(displayTotal)}
                  highlight
                />
              </Paper>
              {showGeneralServiceFees ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    General service fees
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <SummaryRow
                      label="Total clinic fees"
                      value={formatInvoiceMoney(summary.total_clinic_fees) || '—'}
                    />
                    <SummaryRow
                      label="Total doctor fees"
                      value={formatInvoiceMoney(summary.total_doctor_fees) || '—'}
                    />
                  </Paper>
                </Box>
              ) : null}
            </Stack>
          )}
        </Box>

        <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 2, alignSelf: 'flex-end' }}>
          Close
        </Button>
      </Stack>
    </Drawer>
  );
}

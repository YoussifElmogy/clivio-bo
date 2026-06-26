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
import { useToast } from '../../context/ToastContext';
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
  const { get } = useApi();
  const { showError } = useToast();

  const defaults = useMemo(() => defaultInvoiceSummaryDateRange(), []);

  const [dateFrom, setDateFrom] = useState(defaults.dateFrom);
  const [dateTo, setDateTo] = useState(defaults.dateTo);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState(INVOICE_PAYMENT_TYPE_FILTER_ALL);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const resetFilters = useCallback(() => {
    setDateFrom('');
    setDateTo('');
    setPaymentTypeFilter(INVOICE_PAYMENT_TYPE_FILTER_ALL);
  }, []);

  const fetchSummary = useCallback(
    async (from, to) => {
      const fromKey = String(from ?? '').trim();
      const toKey = String(to ?? '').trim();

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
        const query = buildInvoiceDailySummaryQuery({ dateFrom: fromKey, dateTo: toKey });
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
    [get, showError]
  );

  useEffect(() => {
    if (!open) return;
    const range = defaultInvoiceSummaryDateRange();
    setDateFrom(range.dateFrom);
    setDateTo(range.dateTo);
    setPaymentTypeFilter(INVOICE_PAYMENT_TYPE_FILTER_ALL);
    fetchSummary(range.dateFrom, range.dateTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleApply = () => {
    fetchSummary(dateFrom, dateTo);
  };

  const handleClearFilters = () => {
    resetFilters();
    setSummary(null);
    fetchSummary('', '');
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
            onChange={v => setDateFrom(v?.isValid?.() ? v.format('YYYY-MM-DD') : '')}
            disabled={loading}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />
          <DatePicker
            label="Date to"
            value={dateTo && dayjs(dateTo).isValid() ? dayjs(dateTo) : null}
            onChange={v => setDateTo(v?.isValid?.() ? v.format('YYYY-MM-DD') : '')}
            disabled={loading}
            minDate={dateFrom && dayjs(dateFrom).isValid() ? dayjs(dateFrom) : undefined}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />
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

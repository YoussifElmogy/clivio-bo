import { parsePaginatedList } from '../utils/parsePaginatedList';
import { formatMoney } from '../utils/formatMoney';

export function normalizeInvoicesList(data) {
  const parsed = parsePaginatedList(data, { listKeys: ['invoices', 'results'] });
  let total = parsed.total;
  let mode = parsed.mode;
  if (data && typeof data === 'object') {
    if (typeof data.count === 'number' && !Number.isNaN(data.count)) {
      total = data.count;
      mode = 'server';
    } else if (typeof data.total === 'number' && !Number.isNaN(data.total)) {
      total = data.total;
      mode = 'server';
    }
  }
  return { rows: parsed.rows, total, mode };
}

export const INVOICES_BRANCH_FILTER_ALL = 'all';
export const INVOICES_STATUS_FILTER_ALL = '';

export const INVOICE_STATUS_FILTER_OPTIONS = [
  { value: INVOICES_STATUS_FILTER_ALL, label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
];

export function buildInvoicesListQuery({ branchId, status, search, visitDate, page, pageSize }) {
  const params = new URLSearchParams();
  const branchKey =
    branchId != null && branchId !== '' && String(branchId) !== INVOICES_BRANCH_FILTER_ALL
      ? String(branchId)
      : '';
  if (branchKey) {
    params.set('branch_id', branchKey);
  }
  const statusKey = String(status ?? '').trim().toLowerCase();
  if (statusKey === 'pending' || statusKey === 'partial' || statusKey === 'paid') {
    params.set('status', statusKey);
  }
  const searchKey = String(search ?? '').trim();
  if (searchKey) {
    params.set('search', searchKey);
  }
  const visitDateKey = String(visitDate ?? '').trim();
  if (visitDateKey) {
    params.set('visit_date', visitDateKey);
  }
  params.set('page', String(page));
  params.set('page_size', String(pageSize));
  return params.toString();
}

export function formatInvoiceVisitDate(value) {
  if (value == null || value === '') return '—';
  const s = String(value).trim();
  if (!s) return '—';
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(`${s.slice(0, 10)}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    return s.slice(0, 10);
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  return s;
}

export function invoicePayUrl(invoiceId) {
  return `/invoices/${encodeURIComponent(invoiceId)}/pay`;
}

/** Backend invoice payment_type values. */
export const INVOICE_PAYMENT_TYPE = {
  INSTAPAY: 1,
  CASH: 2,
  VISA: 3,
};

export const INVOICE_PAYMENT_TYPE_OPTIONS = [
  { value: INVOICE_PAYMENT_TYPE.CASH, label: 'Cash' },
  { value: INVOICE_PAYMENT_TYPE.INSTAPAY, label: 'Instapay' },
  { value: INVOICE_PAYMENT_TYPE.VISA, label: 'Visa' },
];

export const INVOICE_PAYMENT_TYPE_DEFAULT = INVOICE_PAYMENT_TYPE.CASH;

export const INVOICE_PAYMENT_TYPE_FILTER_ALL = 'all';

export const INVOICE_PAYMENT_TYPE_FILTER_OPTIONS = [
  { value: INVOICE_PAYMENT_TYPE_FILTER_ALL, label: 'All types' },
  ...INVOICE_PAYMENT_TYPE_OPTIONS,
];

export const INVOICE_DAILY_SUMMARY_URL = '/invoices/daily-summary';

function isoDateOnly(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Default summary range: today (from and to). */
export function defaultInvoiceSummaryDateRange() {
  const today = isoDateOnly(new Date());
  return { dateFrom: today, dateTo: today };
}

export function buildInvoiceDailySummaryQuery({ dateFrom, dateTo }) {
  const params = new URLSearchParams();
  const from = String(dateFrom ?? '').trim();
  const to = String(dateTo ?? '').trim();
  if (from) params.set('date_from', from);
  if (to) params.set('date_to', to);
  return params.toString();
}

export function normalizeInvoiceDailySummary(data) {
  if (!data || typeof data !== 'object') {
    return { date_from: '', date_to: '', total: null, breakdown: [] };
  }
  const breakdown = Array.isArray(data.breakdown)
    ? data.breakdown.map(row => ({
        payment_type: Number(row.payment_type),
        payment_type_label:
          String(row.payment_type_label ?? '').trim() ||
          INVOICE_PAYMENT_TYPE_OPTIONS.find(o => o.value === Number(row.payment_type))?.label ||
          '—',
        total: row.total,
      }))
    : [];
  return {
    date_from: String(data.date_from ?? '').trim(),
    date_to: String(data.date_to ?? '').trim(),
    total: data.total,
    breakdown,
  };
}

export function filterInvoiceSummaryBreakdown(breakdown, paymentTypeFilter) {
  if (!Array.isArray(breakdown)) return [];
  if (
    paymentTypeFilter === INVOICE_PAYMENT_TYPE_FILTER_ALL ||
    paymentTypeFilter === '' ||
    paymentTypeFilter == null
  ) {
    return breakdown;
  }
  const pt = Number(paymentTypeFilter);
  return breakdown.filter(row => row.payment_type === pt);
}

/** Grand total for display — API total when showing all types, else sum of filtered rows. */
export function invoiceSummaryDisplayTotal(summary, paymentTypeFilter) {
  if (!summary) return null;
  const filtered = filterInvoiceSummaryBreakdown(summary.breakdown, paymentTypeFilter);
  const showAll =
    paymentTypeFilter === INVOICE_PAYMENT_TYPE_FILTER_ALL ||
    paymentTypeFilter === '' ||
    paymentTypeFilter == null;
  if (showAll) return summary.total;
  if (filtered.length === 0) return '0';
  if (filtered.length === 1) return filtered[0].total;
  const sum = filtered.reduce((acc, row) => acc + (parseInvoiceMoneyNumber(row.total) ?? 0), 0);
  return sum;
}

export function formatInvoiceSummaryDateLabel(iso) {
  return formatInvoiceVisitDate(iso);
}

export function buildInvoicePayPayload(amountPaid, paymentType) {
  const n = Number(amountPaid);
  if (!Number.isFinite(n) || n <= 0) {
    const err = new Error('Enter a valid amount paid.');
    err.validationMessage = 'Enter a valid amount paid.';
    throw err;
  }
  const pt = Number(paymentType);
  const allowed = INVOICE_PAYMENT_TYPE_OPTIONS.map(o => o.value);
  if (!allowed.includes(pt)) {
    const err = new Error('Select a payment type.');
    err.validationMessage = 'Select a payment type.';
    throw err;
  }
  return { amount_paid: Number(n.toFixed(2)), payment_type: pt };
}

export function invoiceMaxPayAmount(row) {
  const remaining = parseInvoiceMoneyNumber(row?.remaining);
  if (remaining != null && remaining > 0) return remaining;
  const total = parseInvoiceMoneyNumber(row?.total);
  const paid = parseInvoiceMoneyNumber(row?.paid_amount) ?? 0;
  if (total != null && total > 0) {
    const derivedRemaining = total - paid;
    return derivedRemaining > 0 ? derivedRemaining : null;
  }
  return null;
}

export function validateInvoicePayAmount(amountPaid, row, paymentType) {
  const payload = buildInvoicePayPayload(amountPaid, paymentType);
  const max = invoiceMaxPayAmount(row);
  if (max != null && payload.amount_paid > max) {
    return {
      ok: false,
      message: `Amount paid cannot exceed remaining (${formatInvoiceMoney(max)}).`,
    };
  }
  return { ok: true, payload };
}

export function invoiceDefaultPayAmount(row) {
  const remaining = parseInvoiceMoneyNumber(row?.remaining);
  if (remaining != null && remaining > 0) return remaining;
  const total = parseInvoiceMoneyNumber(row?.total);
  if (total != null && total > 0) return total;
  return '';
}

export function parseInvoiceMoneyNumber(value) {
  if (value == null || value === '') return null;
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

export function invoiceTypeLabel(type) {
  const s = String(type ?? '')
    .trim()
    .toLowerCase();
  if (s === 'reservation') return 'Reservation';
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatInvoiceMoney(value, currency = 'EGP') {
  return formatMoney(value, currency);
}

export function invoiceStatusLabel(status) {
  const s = String(status ?? '')
    .trim()
    .toLowerCase();
  if (s === 'paid') return 'Paid';
  if (s === 'partial' || s === 'partially_paid') return 'Partial';
  if (s === 'pending') return 'Pending';
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';
}

export function isInvoicePaidStatus(status) {
  return String(status ?? '')
    .trim()
    .toLowerCase() === 'paid';
}

export function invoiceViewUrl(row) {
  const raw = row?.invoice_url ?? row?.url ?? '';
  const value = String(raw).trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return value;
  return `/${value.replace(/^\/+/, '')}`;
}

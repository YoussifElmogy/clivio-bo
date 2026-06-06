import { parsePaginatedList } from '../utils/parsePaginatedList';

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

export function buildInvoicesListQuery({ branchId, status, page, pageSize }) {
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
  params.set('page', String(page));
  params.set('page_size', String(pageSize));
  return params.toString();
}

export function invoicePayUrl(invoiceId) {
  return `/invoices/${encodeURIComponent(invoiceId)}/pay`;
}

export function buildInvoicePayPayload(amountPaid) {
  const n = Number(amountPaid);
  if (!Number.isFinite(n) || n <= 0) {
    const err = new Error('Enter a valid amount paid.');
    err.validationMessage = 'Enter a valid amount paid.';
    throw err;
  }
  return { amount_paid: Number(n.toFixed(2)) };
}

export function invoiceMaxPayAmount(row) {
  const total = parseInvoiceMoneyNumber(row?.total) ?? 0;
  const previousRemaining = parseInvoiceMoneyNumber(row?.previous_remaining) ?? 0;
  const max = total + previousRemaining;
  return max > 0 ? max : null;
}

export function validateInvoicePayAmount(amountPaid, row) {
  const payload = buildInvoicePayPayload(amountPaid);
  const max = invoiceMaxPayAmount(row);
  if (max != null && payload.amount_paid > max) {
    return {
      ok: false,
      message: `Amount paid cannot exceed total + previous remaining (${formatInvoiceMoney(max)}).`,
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
  if (value == null || value === '') return '—';
  const s = String(value).trim();
  if (!s) return '—';
  const n = Number(s);
  if (Number.isFinite(n)) {
    return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  }
  return s;
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

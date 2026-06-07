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

export function validateInvoicePayAmount(amountPaid, row) {
  const payload = buildInvoicePayPayload(amountPaid);
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

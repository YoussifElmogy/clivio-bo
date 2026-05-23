import { parsePaginatedList } from '../utils/parsePaginatedList';

export function normalizeInvoicesList(data) {
  const parsed = parsePaginatedList(data, { listKeys: ['invoices'] });
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

export function buildInvoicesListQuery({ branchId, page, pageSize }) {
  const params = new URLSearchParams();
  const branchKey =
    branchId != null && branchId !== '' && String(branchId) !== INVOICES_BRANCH_FILTER_ALL
      ? String(branchId)
      : '';
  if (branchKey) {
    params.set('branch_id', branchKey);
  }
  params.set('page', String(page));
  params.set('page_size', String(pageSize));
  return params.toString();
}

export function invoicePayUrl(invoiceId) {
  return `/invoices/${encodeURIComponent(invoiceId)}/pay`;
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

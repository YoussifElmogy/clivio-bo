/** Normalize invoice_status from reservation-summary or list row. */
export function extractInvoiceStatus(data) {
  if (!data || typeof data !== 'object') return '';
  const raw =
    data.invoice_status ??
    data.reservation?.invoice_status ??
    data.invoice?.status ??
    data.invoice?.invoice_status ??
    data.reservation?.invoice?.status ??
    data.reservation?.invoice?.invoice_status ??
    '';
  return String(raw).trim().toLowerCase();
}

const LOCKED_INVOICE_STATUSES = new Set(['paid', 'partial', 'partially_paid']);

/** True when invoice is paid or partially paid — appointment editing is locked. */
export function isReservationInvoicePaid(dataOrStatus) {
  const status =
    typeof dataOrStatus === 'string'
      ? dataOrStatus.trim().toLowerCase()
      : extractInvoiceStatus(dataOrStatus);
  return LOCKED_INVOICE_STATUSES.has(status);
}

export function isReservationInvoicePaidFromRow(row) {
  return isReservationInvoicePaid(row);
}

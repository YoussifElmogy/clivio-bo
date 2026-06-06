/** Normalize invoice_status from reservation-summary or list row. */
export function extractInvoiceStatus(data) {
  if (!data || typeof data !== 'object') return '';
  const raw = data.invoice_status ?? data.reservation?.invoice_status ?? '';
  return String(raw).trim().toLowerCase();
}

/** Invoice statuses that lock appointment editing (paid or partially paid). */
export function isReservationInvoicePaid(dataOrStatus) {
  const status =
    typeof dataOrStatus === 'string'
      ? dataOrStatus.trim().toLowerCase()
      : extractInvoiceStatus(dataOrStatus);
  return status === 'paid' || status === 'partial';
}

export function isReservationInvoicePaidFromRow(row) {
  return isReservationInvoicePaid(row);
}

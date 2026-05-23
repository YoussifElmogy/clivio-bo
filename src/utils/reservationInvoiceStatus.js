/** Normalize invoice_status from reservation-summary or list row. */
export function extractInvoiceStatus(data) {
  if (!data || typeof data !== 'object') return '';
  const raw = data.invoice_status ?? data.reservation?.invoice_status ?? '';
  return String(raw).trim().toLowerCase();
}

export function isReservationInvoicePaid(dataOrStatus) {
  if (typeof dataOrStatus === 'string') {
    return dataOrStatus.trim().toLowerCase() === 'paid';
  }
  return extractInvoiceStatus(dataOrStatus) === 'paid';
}

export function isReservationInvoicePaidFromRow(row) {
  return isReservationInvoicePaid(row);
}

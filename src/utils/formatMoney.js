/** Whole numbers omit decimals; fractional amounts show up to 2 decimal places. */
export function formatMoneyAmount(value) {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatMoney(value, currency = 'EGP') {
  const formatted = formatMoneyAmount(value);
  if (formatted == null) return '—';
  const n = Number(String(value).trim());
  if (!Number.isFinite(n)) return formatted;
  return currency ? `${formatted} ${currency}` : formatted;
}

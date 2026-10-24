import dayjs from 'dayjs';

/** Default calendar date when none is chosen (today, local). */
export function minBookableVisitDate() {
  return dayjs().startOf('day');
}

export function minBookableVisitDateIso() {
  return minBookableVisitDate().format('YYYY-MM-DD');
}

/** Any valid calendar day is bookable (past years included for back-office booking). */
export function isBookableVisitDate(value) {
  const d = dayjs(String(value ?? '').trim().slice(0, 10));
  return d.isValid();
}

/** Normalizes YYYY-MM-DD; falls back to today if invalid. Does not clamp past dates. */
export function clampBookableVisitDateIso(value) {
  const raw = String(value ?? '').trim().slice(0, 10);
  const d = dayjs(raw);
  if (!d.isValid()) return minBookableVisitDateIso();
  return raw;
}

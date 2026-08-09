import dayjs from 'dayjs';

/** Earliest selectable visit date (today, local). */
export function minBookableVisitDate() {
  return dayjs().startOf('day');
}

export function minBookableVisitDateIso() {
  return minBookableVisitDate().format('YYYY-MM-DD');
}

export function isBookableVisitDate(value) {
  const d = dayjs(String(value ?? '').trim().slice(0, 10));
  if (!d.isValid()) return false;
  return !d.isBefore(minBookableVisitDate(), 'day');
}

/** Clamps YYYY-MM-DD to today or later. */
export function clampBookableVisitDateIso(value) {
  const raw = String(value ?? '').trim().slice(0, 10);
  const d = dayjs(raw);
  if (!d.isValid()) return minBookableVisitDateIso();
  if (d.isBefore(minBookableVisitDate(), 'day')) return minBookableVisitDateIso();
  return raw;
}

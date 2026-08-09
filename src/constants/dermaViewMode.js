import { getResolvedDermaAppointmentTabs } from '../config/packageFeatures';

/**
 * Derma appointment tabs: `true` = show tab, `false` = hide completely.
 * Driven by lookup `features` (cookie) when available; otherwise package tier / env.
 */
export function getDermaAppointmentTabs() {
  return getResolvedDermaAppointmentTabs();
}

/** @deprecated Use getDermaAppointmentTabs() — evaluated once at import in legacy builds. */
export const DERMA_APPOINTMENT_TABS = getDermaAppointmentTabs();

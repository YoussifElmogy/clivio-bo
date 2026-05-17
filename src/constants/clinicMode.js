/** Clinic workflow for doctors: prescription summary vs derma zone mapping. */
export const CLINIC_MODE = {
  PRESCRIPTION: 'prescription',
  DERMA: 'derma',
};

export function normalizeClinicMode(value) {
  const v = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (v === 'derma' || v === 'dermatology' || v === 'derma_clinic') {
    return CLINIC_MODE.DERMA;
  }
  return CLINIC_MODE.PRESCRIPTION;
}

function readEnvClinicMode() {
  const env = import.meta.env.VITE_DOCTOR_CLINIC_MODE;
  if (env == null || String(env).trim() === '') return null;
  return normalizeClinicMode(env);
}

/**
 * Resolve clinic mode from API/JWT fields, then `.env`, then default prescription.
 * @param {object} [sources]
 * @param {unknown} [sources.clinic_mode]
 * @param {unknown} [sources.clinicMode]
 * @param {unknown} [sources.clinic_type]
 * @param {unknown} [sources.clinicType]
 * @param {unknown} [sources.fromToken]
 * @returns {'prescription'|'derma'}
 */
export function resolveClinicMode(sources = {}) {
  const explicit = [
    sources.clinic_mode,
    sources.clinicMode,
    sources.clinic_type,
    sources.clinicType,
    sources.fromToken,
  ];
  for (const raw of explicit) {
    if (raw != null && String(raw).trim() !== '') {
      return normalizeClinicMode(raw);
    }
  }
  const fromEnv = readEnvClinicMode();
  if (fromEnv) return fromEnv;
  return CLINIC_MODE.PRESCRIPTION;
}

/**
 * When `VITE_DOCTOR_CLINIC_MODE` is set in `.env`, it wins (local dev / explicit override).
 * Otherwise uses stored user fields from login or cookie.
 * @param {object|null|undefined} user
 * @returns {'prescription'|'derma'}
 */
export function getClinicModeFromUser(user) {
  const fromEnv = readEnvClinicMode();
  if (fromEnv) return fromEnv;

  if (user && typeof user === 'object') {
    return resolveClinicMode({
      clinic_mode: user.clinic_mode,
      clinicMode: user.clinicMode,
      clinic_type: user.clinic_type,
      clinicType: user.clinicType,
    });
  }

  return CLINIC_MODE.PRESCRIPTION;
}

export function isDermaClinicMode(user) {
  return getClinicModeFromUser(user) === CLINIC_MODE.DERMA;
}

export function isPrescriptionClinicMode(user) {
  return getClinicModeFromUser(user) === CLINIC_MODE.PRESCRIPTION;
}

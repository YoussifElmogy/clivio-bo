export const PACKAGE_TYPE_PULSE = 1;
export const PACKAGE_TYPE_AREA = 2;

function toPositiveInt(raw) {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function pulsePackageTitle(pkg) {
  const desc = typeof pkg?.description === 'string' ? pkg.description.trim() : '';
  if (desc) return desc;
  const packageId = pkg?.package_id;
  return packageId != null ? `Pulse package #${packageId}` : 'Pulse package';
}

export function areaPackageTitle(pkg) {
  const name = typeof pkg?.name === 'string' ? pkg.name.trim() : '';
  if (name) return name;
  const packageId = pkg?.package_id;
  return packageId != null ? `Area package #${packageId}` : 'Area package';
}

/** Keeps pulse input within 1 … remaining (empty string allowed while typing). */
export function clampPulseUsedInput(raw, remaining) {
  const text = raw == null ? '' : String(raw);
  if (text === '') return '';

  const max = Math.max(0, Number(remaining) || 0);
  if (max === 0) return '';

  const n = Number(text);
  if (!Number.isFinite(n)) return text;
  if (n <= 0) return '1';
  if (n > max) return String(max);
  return String(Math.floor(n));
}

/**
 * @param {Array<{ type: number, record_id: number, used_pulses?: number|string }>} selections
 * @param {object[]} pulsePackages
 * @param {object[]} areaPackages
 */
export function buildUsedPackagesReviewSummary(selections, pulsePackages = [], areaPackages = []) {
  const pulseByRecordId = new Map(
    pulsePackages.map(pkg => [Number(pkg.record_id), pkg]).filter(([id]) => Number.isFinite(id))
  );
  const areaByRecordId = new Map(
    areaPackages.map(pkg => [Number(pkg.record_id), pkg]).filter(([id]) => Number.isFinite(id))
  );

  const pulseItems = [];
  const areaItems = [];

  for (const item of Array.isArray(selections) ? selections : []) {
    const type = Number(item?.type);
    const record_id = toPositiveInt(item?.record_id);
    if (record_id == null) continue;

    if (type === PACKAGE_TYPE_PULSE) {
      const pkg = pulseByRecordId.get(record_id);
      const catalogRemaining = Number(pkg?.remaining_pulses) || 0;
      const used_pulses = Number(item.used_pulses) || 0;
      pulseItems.push({
        record_id,
        title: pulsePackageTitle(pkg),
        used_pulses,
        remaining_pulses: Math.max(0, catalogRemaining - used_pulses),
        price: pkg?.price ?? null,
      });
    } else if (type === PACKAGE_TYPE_AREA) {
      const pkg = areaByRecordId.get(record_id);
      areaItems.push({
        record_id,
        title: areaPackageTitle(pkg),
        price: pkg?.price ?? null,
      });
    }
  }

  return {
    pulseItems,
    areaItems,
    hasSelections: pulseItems.length > 0 || areaItems.length > 0,
  };
}

/**
 * Split `packages` from GET /patient-profile into pulse (type 1) and area (type 2) lists.
 */
export function normalizePatientProfilePackages(data) {
  const raw = data?.packages;
  if (!Array.isArray(raw)) {
    return { pulsePackages: [], areaPackages: [] };
  }

  const pulsePackages = [];
  const areaPackages = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const type = Number(entry.type);
    const record_id = toPositiveInt(entry.record_id);
    if (record_id == null) continue;

    if (type === PACKAGE_TYPE_PULSE) {
      pulsePackages.push({
        ...entry,
        type: PACKAGE_TYPE_PULSE,
        record_id,
        remaining_pulses: Number(entry.remaining_pulses) || 0,
        total_pulses: Number(entry.total_pulses) || 0,
      });
    } else if (type === PACKAGE_TYPE_AREA) {
      areaPackages.push({
        ...entry,
        type: PACKAGE_TYPE_AREA,
        record_id,
        is_used: Boolean(entry.is_used),
      });
    }
  }

  return { pulsePackages, areaPackages };
}

/**
 * Validates appointment laser package selections and builds POST `used_packages`.
 *
 * @param {Array<{ type: number, record_id: number, used_pulses?: number|string }>} selections
 * @param {{ pulsePackages?: object[] }} [options]
 */
export function validateUsedPackagesForSubmit(selections, { pulsePackages = [] } = {}) {
  if (!Array.isArray(selections) || selections.length === 0) {
    return { ok: true, used_packages: [] };
  }

  const remainingByRecordId = new Map();
  for (const pkg of pulsePackages) {
    const record_id = toPositiveInt(pkg?.record_id);
    if (record_id != null) {
      remainingByRecordId.set(record_id, Number(pkg.remaining_pulses) || 0);
    }
  }

  const used_packages = [];

  for (const item of selections) {
    const type = Number(item?.type);
    const record_id = toPositiveInt(item?.record_id);
    if (record_id == null) {
      return { ok: false, message: 'Invalid package selection.' };
    }

    if (type === PACKAGE_TYPE_PULSE) {
      const used_pulses = Number(item.used_pulses);
      if (!Number.isFinite(used_pulses) || used_pulses <= 0) {
        return { ok: false, message: 'Enter pulses used for each selected pulse package.' };
      }
      const remaining = remainingByRecordId.get(record_id);
      if (remaining != null && used_pulses > remaining) {
        return {
          ok: false,
          message: `Pulses used cannot exceed remaining (${remaining.toLocaleString()}).`,
        };
      }
      used_packages.push({ type: PACKAGE_TYPE_PULSE, record_id, used_pulses });
    } else if (type === PACKAGE_TYPE_AREA) {
      used_packages.push({ type: PACKAGE_TYPE_AREA, record_id });
    } else {
      return { ok: false, message: 'Invalid package type.' };
    }
  }

  return { ok: true, used_packages };
}

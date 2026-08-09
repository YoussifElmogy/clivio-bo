import { assistantCreateDefaultValues } from '../schemas/assistantSchema';
import { withTenantClinicId } from '../config/tenantConfig';
import {
  buildInternationalPhone,
  splitPhoneNumber,
} from '../utils/phoneNumber';

/**
 * Normalizes GET /assistant-roles (or similar) to an array of role objects.
 */
export function parseAssistantRolesResponse(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.roles)) return data.roles;
  }
  return [];
}

function normalizeBranchIdsFromRow(row) {
  if (!row || typeof row !== 'object') return [];

  if (Array.isArray(row.branch_ids)) {
    return row.branch_ids.map(Number).filter(n => !Number.isNaN(n));
  }

  if (Array.isArray(row.branches)) {
    return row.branches
      .map(b => (typeof b === 'object' && b != null ? Number(b.id) : Number(b)))
      .filter(n => !Number.isNaN(n));
  }

  let branchRaw = row.branch_id;
  if (branchRaw === '' || branchRaw == null || Number.isNaN(Number(branchRaw))) {
    const nested = row.branch;
    if (nested && typeof nested === 'object' && nested.id != null) {
      branchRaw = nested.id;
    }
  }
  if (branchRaw !== '' && branchRaw != null && !Number.isNaN(Number(branchRaw))) {
    return [Number(branchRaw)];
  }

  return [];
}

/** Branch labels for list cells. */
export function formatAssistantBranchesCell(row) {
  if (!row || typeof row !== 'object') return '—';

  if (Array.isArray(row.branches) && row.branches.length) {
    const names = row.branches
      .map(b => (typeof b === 'object' && b != null ? b.name?.trim() : ''))
      .filter(Boolean);
    if (names.length) return names.join(', ');
  }

  if (Array.isArray(row.branch_names) && row.branch_names.length) {
    const names = row.branch_names.map(n => String(n).trim()).filter(Boolean);
    if (names.length) return names.join(', ');
  }

  const ids = normalizeBranchIdsFromRow(row);
  if (ids.length) {
    return ids.map(id => `#${id}`).join(', ');
  }

  const single =
    row.branch_name?.trim() || row.branch?.name?.trim() || null;
  return single || '—';
}

/**
 * Maps GET /assistants/:id (or wrapped `{ assistant }`) to form default shape.
 */
export function mergeAssistantFromApi(data) {
  const row =
    data && typeof data === 'object' && data.assistant && typeof data.assistant === 'object'
      ? data.assistant
      : data;
  if (!row || typeof row !== 'object') {
    return { ...assistantCreateDefaultValues };
  }

  let role_ids = [];
  if (Array.isArray(row.role_ids)) {
    role_ids = row.role_ids.map(Number).filter(n => !Number.isNaN(n));
  } else if (Array.isArray(row.roles)) {
    role_ids = row.roles
      .map(r =>
        typeof r === 'object' && r != null ? Number(r.id ?? r.role_id) : Number(r)
      )
      .filter(n => !Number.isNaN(n));
  }

  const branch_ids = normalizeBranchIdsFromRow(row);
  const phoneParts = splitPhoneNumber(row.phone);

  return {
    name: typeof row.name === 'string' ? row.name : '',
    email: typeof row.email === 'string' ? row.email : '',
    phone_country_code: phoneParts.countryCode,
    phone: phoneParts.nationalNumber,
    branch_ids,
    password: '',
    role_ids,
  };
}

/**
 * Builds POST /assistants body from form values.
 */
export function buildAssistantCreatePayload(values) {
  const payload = buildAssistantWritePayload(values);
  return withTenantClinicId(payload);
}

/** PATCH /assistants/:id — same shape as create, without clinic_id. */
export function buildAssistantUpdatePayload(values) {
  return buildAssistantWritePayload(values);
}

function buildAssistantWritePayload(values) {
  const role_ids = [...(values.role_ids ?? [])]
    .map(Number)
    .filter(n => !Number.isNaN(n))
    .sort((a, b) => a - b);

  const branch_ids = [...(values.branch_ids ?? [])]
    .map(Number)
    .filter(n => !Number.isNaN(n))
    .sort((a, b) => a - b);

  const payload = {
    name: values.name.trim(),
    email: values.email.trim(),
    phone: buildInternationalPhone(values.phone_country_code, values.phone),
    branch_ids,
    role_ids,
  };
  const pw = typeof values.password === 'string' ? values.password.trim() : '';
  if (pw) payload.password = pw;
  return payload;
}

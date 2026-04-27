import { assistantCreateDefaultValues } from '../schemas/assistantSchema';

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

  let branchRaw = row.branch_id;
  if (branchRaw === '' || branchRaw == null || Number.isNaN(Number(branchRaw))) {
    const nested = row.branch;
    if (nested && typeof nested === 'object' && nested.id != null) {
      branchRaw = nested.id;
    }
  }
  const branch_id =
    branchRaw !== '' && branchRaw != null && !Number.isNaN(Number(branchRaw))
      ? Number(branchRaw)
      : '';

  return {
    name: typeof row.name === 'string' ? row.name : '',
    email: typeof row.email === 'string' ? row.email : '',
    phone: typeof row.phone === 'string' ? row.phone : '',
    branch_id,
    password: '',
    role_ids,
  };
}

/**
 * Builds POST /assistants body from form values.
 */
export function buildAssistantCreatePayload(values) {
  const role_ids = [...(values.role_ids ?? [])]
    .map(Number)
    .filter(n => !Number.isNaN(n))
    .sort((a, b) => a - b);

  const payload = {
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    branch_id: Number(values.branch_id),
    role_ids,
  };
  const pw = typeof values.password === 'string' ? values.password.trim() : '';
  if (pw) payload.password = pw;
  return payload;
}

/** PATCH /assistants/:id — same shape as create. */
export function buildAssistantUpdatePayload(values) {
  return buildAssistantCreatePayload(values);
}

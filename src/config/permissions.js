/**
 * Backend `role_name` values from login `roles[]` (snake_case).
 * Inventory covers Services + Injectables + Machines.
 */
export const PERM = {
  VIEW_PATIENT: 'view_patient',
  ADD_PATIENT: 'add_patient',
  EDIT_PATIENT: 'edit_patient',
  DELETE_PATIENT: 'delete_patient',

  VIEW_APPOINTMENT: 'view_appointment',
  ADD_APPOINTMENT: 'add_appointment',
  EDIT_APPOINTMENT: 'edit_appointment',
  DELETE_APPOINTMENT: 'delete_appointment',

  VIEW_BRANCH: 'view_branch',
  ADD_BRANCH: 'add_branch',
  EDIT_BRANCH: 'edit_branch',
  DELETE_BRANCH: 'delete_branch',

  VIEW_DOCTOR: 'view_doctor',
  ADD_DOCTOR: 'add_doctor',
  EDIT_DOCTOR: 'edit_doctor',
  DELETE_DOCTOR: 'delete_doctor',

  VIEW_CONFIG: 'view_config',
  EDIT_CONFIG: 'edit_config',

  VIEW_INVENTORY: 'view_inventory',
  ADD_INVENTORY: 'add_inventory',
  EDIT_INVENTORY: 'edit_inventory',
  DELETE_INVENTORY: 'delete_inventory',

  VIEW_ASSISTANT: 'view_assistant',
  ADD_ASSISTANT: 'add_assistant',
  EDIT_ASSISTANT: 'edit_assistant',
  DELETE_ASSISTANT: 'delete_assistant',
};

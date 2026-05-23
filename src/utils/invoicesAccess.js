import { PERM } from '../config/permissions';
import { isAssistantUser, isSuperAdminUser } from './authRoles';
import { canPermission } from './permissions';
import { getUserBranchIds } from './userBranchIds';

export function canAccessInvoices(user) {
  if (isSuperAdminUser(user)) return true;
  if (canPermission(user, PERM.VIEW_INVOICE)) return true;
  return isAssistantUser(user) && getUserBranchIds(user).length > 0;
}

export function canPayInvoices(user) {
  if (isSuperAdminUser(user)) return true;
  if (canPermission(user, PERM.PAY_INVOICE)) return true;
  return isAssistantUser(user) && getUserBranchIds(user).length > 0;
}

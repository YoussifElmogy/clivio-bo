import { useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  buildPermissionSet,
  canPermission,
  shouldBypassPermissions,
} from '../utils/permissions';

export default function usePermissions() {
  const { user } = useAuth();

  const bypass = useMemo(() => shouldBypassPermissions(user), [user]);

  const permissionSet = useMemo(() => buildPermissionSet(user), [user]);

  const can = useCallback(
    permission => canPermission(user, permission),
    [user]
  );

  return {
    can,
    bypass,
    permissionSet,
  };
}

import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from './AuthContext';
import { useLocation, Navigate } from 'react-router-dom';
import { REQUIRED_PASSWORD_CHANGE_PATH } from '../constants/authRoutes';
import usePermissions from '../hooks/usePermissions';
import { isDoctorUser, isSuperAdminUser } from '../utils/authRoles';
import { canAccessInvoices } from '../utils/invoicesAccess';

function listRequiredPermissions(requiresPermission) {
  if (requiresPermission == null) return [];
  const list = Array.isArray(requiresPermission)
    ? requiresPermission
    : [requiresPermission];
  return list.filter(Boolean);
}

/**
 * @param {React.ReactNode} children
 * @param {string|string[]} [requiresPermission] - values like PERM.VIEW_PATIENT; array = all required
 * @param {boolean} [doctorOnly] - when true, only doctor role can access
 * @param {boolean} [invoicesAccess] - assistants with branch_ids or view_invoice permission
 * @param {boolean} [superAdminOnly] - when true, only super admin role can access
 */
const ProtectedRoute = ({
  children,
  requiresPermission,
  doctorOnly = false,
  invoicesAccess = false,
  superAdminOnly = false,
}) => {
  const { isAuthenticated, mustChangePassword, user } = useAuth();
  const { can } = usePermissions();
  const location = useLocation();

  if (isAuthenticated === null) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/login" state={{ from: location }} replace />
    );
  }

  if (mustChangePassword && location.pathname !== REQUIRED_PASSWORD_CHANGE_PATH) {
    return <Navigate to={REQUIRED_PASSWORD_CHANGE_PATH} replace />;
  }

  const required = listRequiredPermissions(requiresPermission);
  if (required.length && !required.every(p => can(p))) {
    if (!(invoicesAccess && canAccessInvoices(user))) {
      return <Navigate to="/" replace />;
    }
  }

  if (doctorOnly && !isDoctorUser(user)) {
    return <Navigate to="/" replace />;
  }

  if (superAdminOnly && !isSuperAdminUser(user)) {
    return <Navigate to="/appointments" replace />;
  }

  return children;
};

export default ProtectedRoute;

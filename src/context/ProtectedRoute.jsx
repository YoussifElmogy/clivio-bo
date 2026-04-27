import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from './AuthContext';
import { useLocation, Navigate } from 'react-router-dom';
import { REQUIRED_PASSWORD_CHANGE_PATH } from '../constants/authRoutes';
import usePermissions from '../hooks/usePermissions';

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
 */
const ProtectedRoute = ({ children, requiresPermission }) => {
  const { isAuthenticated, mustChangePassword } = useAuth();
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
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

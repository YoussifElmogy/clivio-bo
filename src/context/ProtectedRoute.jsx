import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from './AuthContext';
import { useLocation, Navigate } from 'react-router-dom';
import { REQUIRED_PASSWORD_CHANGE_PATH } from '../constants/authRoutes';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, mustChangePassword } = useAuth();
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

  return children;
};

export default ProtectedRoute;

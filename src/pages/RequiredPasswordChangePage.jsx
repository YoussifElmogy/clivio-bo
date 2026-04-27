import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import LocalHospitalRounded from '@mui/icons-material/LocalHospitalRounded';
import LockResetOutlined from '@mui/icons-material/LockResetOutlined';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useApi from '../configs/useApi';
import { REQUIRED_PASSWORD_CHANGE_PATH } from '../constants/authRoutes';
import ChangePasswordForm from '../forms/ChangePasswordForm/ChangePasswordForm';

export default function RequiredPasswordChangePage() {
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up('md'));
  const navigate = useNavigate();
  const { isAuthenticated, mustChangePassword, user, updateUser } = useAuth();
  const { post } = useApi();
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    if (isAuthenticated === null) return;
    if (!isAuthenticated) {
      navigate('/login', { replace: true, state: { from: { pathname: REQUIRED_PASSWORD_CHANGE_PATH } } });
      return;
    }
    if (!mustChangePassword) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, mustChangePassword, navigate]);

  const onSubmit = async values => {
    try {
      await post('/auth/change-password', {
        password: values.password.trim(),
        confirm_password: values.confirm_password.trim(),
      });
      updateUser({ mustChangePassword: false });
      showSuccess('Password updated. You can continue.');
      navigate('/', { replace: true });
    } catch (err) {
      const msg =
        (typeof err === 'object' && err !== null && err.error) ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not update password.';
      showError(typeof msg === 'string' ? msg : 'Could not update password.');
    }
  };

  if (isAuthenticated === null) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100dvh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || !mustChangePassword) {
    return null;
  }

  const displayName = user?.fullName?.trim() || user?.username || user?.email || '';

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: isWide ? 'row' : 'column',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          flex: isWide ? '0 0 42%' : 'none',
          minHeight: isWide ? '100dvh' : '32vh',
          background: `linear-gradient(145deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 42%, ${theme.palette.primary.light} 100%)`,
          color: 'primary.contrastText',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: 3,
          py: 4,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.12,
            backgroundImage: `radial-gradient(circle at 20% 30%, white 0%, transparent 45%),
              radial-gradient(circle at 80% 70%, white 0%, transparent 40%)`,
          }}
        />
        <LockResetOutlined
          sx={{
            fontSize: isWide ? 72 : 52,
            mb: 2,
            position: 'relative',
            filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.2))',
          }}
        />
        <Typography
          variant={isWide ? 'h4' : 'h5'}
          component="h1"
          align="center"
          sx={{ position: 'relative', fontWeight: 700, mb: 1 }}
        >
          Password update required
        </Typography>
        <Typography
          variant="body1"
          align="center"
          sx={{
            position: 'relative',
            maxWidth: 360,
            opacity: 0.95,
            lineHeight: 1.6,
          }}
        >
          For security, set a new password before using Clivio. You’ll reach the dashboard right after.
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, sm: 4 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 560,
            p: { xs: 4, sm: 5 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 24px 48px rgba(15, 118, 110, 0.08)',
            backgroundColor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <LocalHospitalRounded color="primary" sx={{ fontSize: 36 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Set new password
            </Typography>
          </Box>

          {displayName ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Signed in as <strong>{displayName}</strong>
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose a strong password you haven’t used elsewhere.
            </Typography>
          )}

          <ChangePasswordForm onSubmit={onSubmit} submitLabel="Save password & continue" />
        </Paper>
      </Box>
    </Box>
  );
}

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import LocalHospitalRounded from '@mui/icons-material/LocalHospitalRounded';
import LoginForm from '../forms/LoginForm/LoginForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { REQUIRED_PASSWORD_CHANGE_PATH } from '../constants/authRoutes';
import { isDoctorUser } from '../utils/authRoles';

export default function LoginPage() {
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;
  const { login, isAuthenticated, user } = useAuth();
  const { showError } = useToast();

  React.useEffect(() => {
    if (isAuthenticated !== true) return;
    if (user?.mustChangePassword) {
      navigate(REQUIRED_PASSWORD_CHANGE_PATH, { replace: true });
      return;
    }
    const homePath = isDoctorUser(user) ? '/appointments' : '/';
    navigate(from || homePath, { replace: true });
  }, [isAuthenticated, user?.mustChangePassword, from, navigate, user]);

  const handleLogin = async values => {
    try {
      await login({
        username: values.username,
        password: values.password,
      });
    } catch (err) {
      const msg =
        (typeof err === 'object' && err !== null && err.error) ||
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Unable to sign in. Check your credentials and try again.';
      showError(typeof msg === 'string' ? msg : 'Sign in failed.');
    }
  };

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
          minHeight: isWide ? '100dvh' : '38vh',
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
        <LocalHospitalRounded
          sx={{
            fontSize: isWide ? 72 : 56,
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
          Clivio Clinic
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
          A calm, focused workspace for your team — appointments, records, and
          care in one place.
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
            maxWidth: 600,
            minHeight: { xs: 520, sm: 560 },
            p: { xs: 4, sm: 5 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 24px 48px rgba(15, 118, 110, 0.08)',
            backgroundColor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
            Welcome back
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Sign in with your clinic credentials to open the dashboard.
          </Typography>
          <LoginForm onSubmit={handleLogin} />
        </Paper>
      </Box>
    </Box>
  );
}

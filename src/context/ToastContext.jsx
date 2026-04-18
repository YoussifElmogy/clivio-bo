import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Slide from '@mui/material/Slide';

const ToastContext = createContext(null);

const defaultDuration = 6000;

/** MUI v9+ Snackbar ignores `TransitionComponent`; use `slots.transition` so Slide actually runs (default is Grow = “pop”). */
const slideTransitionSx = {
  top: { xs: 16, sm: 24 },
  zIndex: theme => theme.zIndex.snackbar,
};

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info',
    duration: defaultDuration,
  });

  const showToast = useCallback((message, options = {}) => {
    const { severity = 'info', duration = defaultDuration } = options;

    setToast({
      open: true,
      message: typeof message === 'string' ? message : String(message),
      severity,
      duration,
    });
  }, []);

  const showSuccess = useCallback(
    (message, opts) => showToast(message, { ...opts, severity: 'success' }),
    [showToast]
  );
  const showError = useCallback(
    (message, opts) => showToast(message, { ...opts, severity: 'error' }),
    [showToast]
  );
  const showWarning = useCallback(
    (message, opts) => showToast(message, { ...opts, severity: 'warning' }),
    [showToast]
  );
  const showInfo = useCallback(
    (message, opts) => showToast(message, { ...opts, severity: 'info' }),
    [showToast]
  );

  const handleClose = useCallback((_, reason) => {
    if (reason === 'clickaway') return;
    setToast(t => ({ ...t, open: false }));
  }, []);

  const value = useMemo(
    () => ({
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
    }),
    [showToast, showSuccess, showError, showWarning, showInfo]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={toast.duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        slots={{ transition: Slide }}
        transitionDuration={{ enter: 450, exit: 240 }}
        slotProps={{
          transition: {
            appear: true,
            easing: {
              enter: 'cubic-bezier(0.22, 1, 0.36, 1)',
              exit: 'cubic-bezier(0.4, 0, 1, 1)',
            },
          },
        }}
        sx={slideTransitionSx}
      >
        <Alert
          onClose={handleClose}
          severity={toast.severity}
          variant="filled"
          elevation={6}
          sx={{
            minWidth: { xs: 'min(100vw - 32px, 420px)', sm: 400 },
            maxWidth: 560,
            alignItems: 'center',
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

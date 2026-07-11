import { createTheme } from '@mui/material/styles';

const primary = {
  main: '#63a59c',
  light: '#14b8a6',
  dark: '#0d5c56',
  contrastText: '#ffffff',
};

export const clinicTheme = createTheme({
  palette: {
    mode: 'light',
    primary,
    secondary: {
      main: '#047857',
      light: '#059669',
      dark: '#065f46',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f0fdf4',
      paper: '#ffffff',
    },
    text: {
      primary: '#134e4a',
      secondary: '#5b6b69',
    },
    divider: 'rgba(15, 118, 110, 0.12)',
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily:
      '"Plus Jakarta Sans", "Open Sans", system-ui, -apple-system, sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          paddingInline: '1.25rem',
        },
        containedPrimary: {
          boxShadow: '0 4px 14px rgba(15, 118, 110, 0.35)',
          '&:hover': {
            boxShadow: '0 6px 18px rgba(15, 118, 110, 0.45)',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

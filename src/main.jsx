import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import appRouter from './router.jsx';
import CustomLoader from './components/skeletons/CustomLoader.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { clinicTheme } from './theme/clinicTheme.js';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={clinicTheme}>
      <CssBaseline />
      <ToastProvider>
        <AuthProvider>
          <Suspense fallback={<CustomLoader show={true} />}>
            <RouterProvider router={appRouter} />
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);

import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { restoreTenantConfigFromStorage } from './config/tenantConfig.js';
import appRouter from './router.jsx';
import CustomLoader from './components/skeletons/CustomLoader.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { clinicTheme } from './theme/clinicTheme.js';
import { registerChunkLoadRecovery } from './utils/chunkLoadRecovery.js';
import { ensureLatestDeploy } from './utils/deployVersionCheck.js';

registerChunkLoadRecovery();

async function bootstrap() {
  const shouldRender = await ensureLatestDeploy();
  if (!shouldRender) return;

  restoreTenantConfigFromStorage();

  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ThemeProvider theme={clinicTheme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <CssBaseline />
          <ToastProvider>
            <AuthProvider>
              <Suspense fallback={<CustomLoader show={true} />}>
                <RouterProvider router={appRouter} />
              </Suspense>
            </AuthProvider>
          </ToastProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

bootstrap();

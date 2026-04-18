import React, { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from './layout/Layout.jsx';
import ProtectedRoute from './context/ProtectedRoute.jsx';

// Lazy load page components for code splitting
const Overview = lazy(() => import('./pages/Overview.jsx'));
const ConfigurationPage = lazy(() => import('./pages/ConfigurationPage.jsx'));

const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));

const appRouter = createBrowserRouter([
  {
    path: '/',    
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Overview />
          </ProtectedRoute>
        ),
      },
      {
        path: 'configuration',
        element: (
          <ProtectedRoute>
            <ConfigurationPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
 
]);

export default appRouter;

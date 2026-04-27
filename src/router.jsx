import React, { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from './layout/Layout.jsx';
import ProtectedRoute from './context/ProtectedRoute.jsx';
import { REQUIRED_PASSWORD_CHANGE_PATH } from './constants/authRoutes.js';

// Lazy load page components for code splitting
const Overview = lazy(() => import('./pages/Overview.jsx'));
const BranchesPage = lazy(() => import('./pages/BranchesPage.jsx'));
const BranchCreatePage = lazy(() => import('./pages/BranchCreatePage.jsx'));
const BranchEditPage = lazy(() => import('./pages/BranchEditPage.jsx'));
const ConfigurationPage = lazy(() => import('./pages/ConfigurationPage.jsx'));
const DoctorsPage = lazy(() => import('./pages/DoctorsPage.jsx'));
const DoctorCreatePage = lazy(() => import('./pages/DoctorCreatePage.jsx'));
const DoctorEditPage = lazy(() => import('./pages/DoctorEditPage.jsx'));
const AssistantsPage = lazy(() => import('./pages/AssistantsPage.jsx'));
const AssistantCreatePage = lazy(() => import('./pages/AssistantCreatePage.jsx'));
const AssistantEditPage = lazy(() => import('./pages/AssistantEditPage.jsx'));
const PatientsPage = lazy(() => import('./pages/PatientsPage.jsx'));
const PatientCreatePage = lazy(() => import('./pages/PatientCreatePage.jsx'));
const PatientEditPage = lazy(() => import('./pages/PatientEditPage.jsx'));
const PatientAppointmentPage = lazy(() => import('./pages/PatientAppointmentPage.jsx'));
const ReservationsPage = lazy(() => import('./pages/ReservationsPage.jsx'));
const ReservationEditPage = lazy(() => import('./pages/ReservationEditPage.jsx'));
const SchedulesPage = lazy(() => import('./pages/SchedulesPage.jsx'));
const ServicesPage = lazy(() => import('./pages/ServicesPage.jsx'));
const ServiceCreatePage = lazy(() => import('./pages/ServiceCreatePage.jsx'));
const ServiceEditPage = lazy(() => import('./pages/ServiceEditPage.jsx'));
const InventoryPage = lazy(() => import('./pages/InventoryPage.jsx'));
const ProductCreatePage = lazy(() => import('./pages/ProductCreatePage.jsx'));
const ProductEditPage = lazy(() => import('./pages/ProductEditPage.jsx'));
const MachineCreatePage = lazy(() => import('./pages/MachineCreatePage.jsx'));
const MachineEditPage = lazy(() => import('./pages/MachineEditPage.jsx'));

const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RequiredPasswordChangePage = lazy(() => import('./pages/RequiredPasswordChangePage.jsx'));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage.jsx'));

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
        path: 'change-password',
        element: (
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'branches/new',
        element: (
          <ProtectedRoute>
            <BranchCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'branches/:id/edit',
        element: (
          <ProtectedRoute>
            <BranchEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'branches',
        element: (
          <ProtectedRoute>
            <BranchesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'doctors/new',
        element: (
          <ProtectedRoute>
            <DoctorCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'doctors/:id/edit',
        element: (
          <ProtectedRoute>
            <DoctorEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'doctors',
        element: (
          <ProtectedRoute>
            <DoctorsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'assistants/new',
        element: (
          <ProtectedRoute>
            <AssistantCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'assistants/:id/edit',
        element: (
          <ProtectedRoute>
            <AssistantEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'assistants',
        element: (
          <ProtectedRoute>
            <AssistantsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'patients/new',
        element: (
          <ProtectedRoute>
            <PatientCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'patients/:id/edit',
        element: (
          <ProtectedRoute>
            <PatientEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'patients/:id/appointment',
        element: (
          <ProtectedRoute>
            <PatientAppointmentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'patients',
        element: (
          <ProtectedRoute>
            <PatientsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'appointments/:id/edit',
        element: (
          <ProtectedRoute>
            <ReservationEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'appointments',
        element: (
          <ProtectedRoute>
            <ReservationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'services/new',
        element: (
          <ProtectedRoute>
            <ServiceCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'services/:id/edit',
        element: (
          <ProtectedRoute>
            <ServiceEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'services',
        element: (
          <ProtectedRoute>
            <ServicesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory/machines/new',
        element: (
          <ProtectedRoute>
            <MachineCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory/machines/:id/edit',
        element: (
          <ProtectedRoute>
            <MachineEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory/new',
        element: (
          <ProtectedRoute>
            <ProductCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory/:id/edit',
        element: (
          <ProtectedRoute>
            <ProductEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory',
        element: (
          <ProtectedRoute>
            <InventoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'schedules',
        element: (
          <ProtectedRoute>
            <SchedulesPage />
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
  {
    path: REQUIRED_PASSWORD_CHANGE_PATH,
    element: <RequiredPasswordChangePage />,
  },
]);

export default appRouter;

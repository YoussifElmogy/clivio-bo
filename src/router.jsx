import React, { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from './layout/Layout.jsx';
import ProtectedRoute from './context/ProtectedRoute.jsx';
import { REQUIRED_PASSWORD_CHANGE_PATH } from './constants/authRoutes.js';
import { PERM } from './config/permissions.js';

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
          <ProtectedRoute requiresPermission={PERM.ADD_BRANCH}>
            <BranchCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'branches/:id/edit',
        element: (
          <ProtectedRoute requiresPermission={PERM.EDIT_BRANCH}>
            <BranchEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'branches',
        element: (
          <ProtectedRoute requiresPermission={PERM.VIEW_BRANCH}>
            <BranchesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'doctors/new',
        element: (
          <ProtectedRoute requiresPermission={PERM.ADD_DOCTOR}>
            <DoctorCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'doctors/:id/edit',
        element: (
          <ProtectedRoute requiresPermission={PERM.EDIT_DOCTOR}>
            <DoctorEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'doctors',
        element: (
          <ProtectedRoute requiresPermission={PERM.VIEW_DOCTOR}>
            <DoctorsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'assistants/new',
        element: (
          <ProtectedRoute requiresPermission={PERM.ADD_ASSISTANT}>
            <AssistantCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'assistants/:id/edit',
        element: (
          <ProtectedRoute requiresPermission={PERM.EDIT_ASSISTANT}>
            <AssistantEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'assistants',
        element: (
          <ProtectedRoute requiresPermission={PERM.VIEW_ASSISTANT}>
            <AssistantsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'patients/new',
        element: (
          <ProtectedRoute requiresPermission={PERM.ADD_PATIENT}>
            <PatientCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'patients/:id/edit',
        element: (
          <ProtectedRoute requiresPermission={PERM.EDIT_PATIENT}>
            <PatientEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'patients/:id/appointment',
        element: (
          <ProtectedRoute
            requiresPermission={[PERM.VIEW_PATIENT, PERM.ADD_APPOINTMENT]}
          >
            <PatientAppointmentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'patients',
        element: (
          <ProtectedRoute requiresPermission={PERM.VIEW_PATIENT}>
            <PatientsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'appointments/:id/edit',
        element: (
          <ProtectedRoute requiresPermission={PERM.EDIT_APPOINTMENT}>
            <ReservationEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'appointments',
        element: (
          <ProtectedRoute requiresPermission={PERM.VIEW_APPOINTMENT}>
            <ReservationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'services/new',
        element: (
          <ProtectedRoute requiresPermission={PERM.ADD_INVENTORY}>
            <ServiceCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'services/:id/edit',
        element: (
          <ProtectedRoute requiresPermission={PERM.EDIT_INVENTORY}>
            <ServiceEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'services',
        element: (
          <ProtectedRoute requiresPermission={PERM.VIEW_INVENTORY}>
            <ServicesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory/machines/new',
        element: (
          <ProtectedRoute requiresPermission={PERM.ADD_INVENTORY}>
            <MachineCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory/machines/:id/edit',
        element: (
          <ProtectedRoute requiresPermission={PERM.EDIT_INVENTORY}>
            <MachineEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory/new',
        element: (
          <ProtectedRoute requiresPermission={PERM.ADD_INVENTORY}>
            <ProductCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory/:id/edit',
        element: (
          <ProtectedRoute requiresPermission={PERM.EDIT_INVENTORY}>
            <ProductEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory',
        element: (
          <ProtectedRoute requiresPermission={PERM.VIEW_INVENTORY}>
            <InventoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'schedules',
        element: (
          <ProtectedRoute requiresPermission={PERM.VIEW_APPOINTMENT}>
            <SchedulesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'configuration',
        element: (
          <ProtectedRoute requiresPermission={PERM.VIEW_CONFIG}>
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

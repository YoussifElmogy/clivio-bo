import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from './layout/Layout.jsx';
import ProtectedRoute from './context/ProtectedRoute.jsx';
import RouteErrorFallback from './components/RouteErrorFallback/RouteErrorFallback.jsx';
import { REQUIRED_PASSWORD_CHANGE_PATH } from './constants/authRoutes.js';
import { PERM } from './config/permissions.js';
import lazyWithRetry from './utils/lazyWithRetry.js';

// Lazy load page components for code splitting (auto-reload on stale chunks)
const Overview = lazyWithRetry(() => import('./pages/Overview.jsx'));
const BranchesPage = lazyWithRetry(() => import('./pages/BranchesPage.jsx'));
const BranchCreatePage = lazyWithRetry(() => import('./pages/BranchCreatePage.jsx'));
const BranchEditPage = lazyWithRetry(() => import('./pages/BranchEditPage.jsx'));
const ConfigurationPage = lazyWithRetry(() => import('./pages/ConfigurationPage.jsx'));
const DoctorsPage = lazyWithRetry(() => import('./pages/DoctorsPage.jsx'));
const DoctorCreatePage = lazyWithRetry(() => import('./pages/DoctorCreatePage.jsx'));
const DoctorEditPage = lazyWithRetry(() => import('./pages/DoctorEditPage.jsx'));
const DoctorMedicinesPage = lazyWithRetry(() => import('./pages/DoctorMedicinesPage.jsx'));
const DoctorMedicineCreatePage = lazyWithRetry(() => import('./pages/DoctorMedicineCreatePage.jsx'));
const DoctorMedicineEditPage = lazyWithRetry(() => import('./pages/DoctorMedicineEditPage.jsx'));
const GeneralServicesPage = lazyWithRetry(() => import('./pages/GeneralServicesPage.jsx'));
const GeneralServiceCreatePage = lazyWithRetry(() => import('./pages/GeneralServiceCreatePage.jsx'));
const GeneralServiceEditPage = lazyWithRetry(() => import('./pages/GeneralServiceEditPage.jsx'));
const AssistantsPage = lazyWithRetry(() => import('./pages/AssistantsPage.jsx'));
const AssistantCreatePage = lazyWithRetry(() => import('./pages/AssistantCreatePage.jsx'));
const AssistantEditPage = lazyWithRetry(() => import('./pages/AssistantEditPage.jsx'));
const PatientsPage = lazyWithRetry(() => import('./pages/PatientsPage.jsx'));
const PatientProfilePage = lazyWithRetry(() => import('./pages/PatientProfilePage.jsx'));
const PatientCreatePage = lazyWithRetry(() => import('./pages/PatientCreatePage.jsx'));
const PatientEditPage = lazyWithRetry(() => import('./pages/PatientEditPage.jsx'));
const PatientAppointmentPage = lazyWithRetry(() => import('./pages/PatientAppointmentPage.jsx'));
const ReservationsPage = lazyWithRetry(() => import('./pages/ReservationsPage.jsx'));
const InvoicesPage = lazyWithRetry(() => import('./pages/InvoicesPage.jsx'));
const ReservationSummaryPage = lazyWithRetry(() => import('./pages/ReservationSummaryPage.jsx'));
const DoctorDermaAppointmentPage = lazyWithRetry(() => import('./pages/DoctorDermaAppointmentPage.jsx'));
const ReservationEditPage = lazyWithRetry(() => import('./pages/ReservationEditPage.jsx'));
const SchedulesPage = lazyWithRetry(() => import('./pages/SchedulesPage.jsx'));
const ServicesPage = lazyWithRetry(() => import('./pages/ServicesPage.jsx'));
const ServiceCreatePage = lazyWithRetry(() => import('./pages/ServiceCreatePage.jsx'));
const ServiceEditPage = lazyWithRetry(() => import('./pages/ServiceEditPage.jsx'));
const InventoryPage = lazyWithRetry(() => import('./pages/InventoryPage.jsx'));
const ProductCreatePage = lazyWithRetry(() => import('./pages/ProductCreatePage.jsx'));
const ProductEditPage = lazyWithRetry(() => import('./pages/ProductEditPage.jsx'));
const MachineCreatePage = lazyWithRetry(() => import('./pages/MachineCreatePage.jsx'));
const MachineEditPage = lazyWithRetry(() => import('./pages/MachineEditPage.jsx'));
const LaserPage = lazyWithRetry(() => import('./pages/LaserPage.jsx'));
const PulsePackageCreatePage = lazyWithRetry(() => import('./pages/PulsePackageCreatePage.jsx'));
const PulsePackageEditPage = lazyWithRetry(() => import('./pages/PulsePackageEditPage.jsx'));
const AreaPackageCreatePage = lazyWithRetry(() => import('./pages/AreaPackageCreatePage.jsx'));
const AreaPackageEditPage = lazyWithRetry(() => import('./pages/AreaPackageEditPage.jsx'));

const LoginPage = lazyWithRetry(() => import('./pages/LoginPage.jsx'));
const RequiredPasswordChangePage = lazyWithRetry(() => import('./pages/RequiredPasswordChangePage.jsx'));
const ChangePasswordPage = lazyWithRetry(() => import('./pages/ChangePasswordPage.jsx'));

const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteErrorFallback />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute superAdminOnly>
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
        path: 'doctor-medicines/new',
        element: (
          <ProtectedRoute requiresPermission={PERM.ADD_DOCTOR}>
            <DoctorMedicineCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'doctor-medicines/:id/edit',
        element: (
          <ProtectedRoute requiresPermission={PERM.EDIT_DOCTOR}>
            <DoctorMedicineEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'doctor-medicines',
        element: (
          <ProtectedRoute requiresPermission={PERM.VIEW_DOCTOR}>
            <DoctorMedicinesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'general-services/new',
        element: (
          <ProtectedRoute doctorOnly allowSuperAdmin>
            <GeneralServiceCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'general-services/:id/edit',
        element: (
          <ProtectedRoute doctorOnly allowSuperAdmin>
            <GeneralServiceEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'general-services',
        element: (
          <ProtectedRoute doctorOnly allowSuperAdmin>
            <GeneralServicesPage />
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
        path: 'patients/:id/profile',
        element: (
          <ProtectedRoute requiresPermission={PERM.VIEW_PATIENT}>
            <PatientProfilePage />
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
        path: 'appointments/:id/derma-mapping',
        element: (
          <ProtectedRoute requiresPermission={PERM.VIEW_APPOINTMENT}>
            <DoctorDermaAppointmentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'appointments/:id/view',
        element: (
          <ProtectedRoute requiresPermission={PERM.VIEW_APPOINTMENT}>
            <ReservationSummaryPage />
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
        path: 'invoices',
        element: (
          <ProtectedRoute requiresPermission={PERM.VIEW_INVOICE} invoicesAccess>
            <InvoicesPage />
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
      {
        path: 'laser/pulse-packages/new',
        element: (
          <ProtectedRoute requiresPermission={PERM.ADD_PULSE_PACKAGE}>
            <PulsePackageCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'laser/pulse-packages/:id/edit',
        element: (
          <ProtectedRoute requiresPermission={PERM.EDIT_PULSE_PACKAGE}>
            <PulsePackageEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'laser/area-packages/new',
        element: (
          <ProtectedRoute requiresPermission={PERM.ADD_AREA_PACKAGE}>
            <AreaPackageCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'laser/area-packages/:id/edit',
        element: (
          <ProtectedRoute requiresPermission={PERM.EDIT_AREA_PACKAGE}>
            <AreaPackageEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'laser',
        element: (
          <ProtectedRoute requiresPermission={PERM.VIEW_LASER}>
            <LaserPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RouteErrorFallback />,
  },
  {
    path: REQUIRED_PASSWORD_CHANGE_PATH,
    element: <RequiredPasswordChangePage />,
    errorElement: <RouteErrorFallback />,
  },
]);

export default appRouter;

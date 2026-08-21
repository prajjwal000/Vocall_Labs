import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import GuestRoute from '../components/GuestRoute';
import AppLayout from '../layouts/AppLayout';
import AdminLayout from '../layouts/AdminLayout';
import PlatformProtectedRoute from '../components/admin/PlatformProtectedRoute';
import PlaceholderPage from '../pages/PlaceholderPage';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import AcceptInvitation from '../pages/auth/AcceptInvitation';
import SettingsPage from '../pages/app/SettingsPage';

// Organization & Customer Workspace Pages
import CreateOrganization from '../pages/organizations/CreateOrganization';
import OrganizationSettings from '../pages/organizations/OrganizationSettings';
import OrganizationInvitations from '../pages/organizations/OrganizationInvitations';
import RolesManagement from '../pages/organizations/RolesManagement';
import Dashboard from '../pages/Dashboard';
import Workflows from '../pages/workflows/Workflows';
import Requests from '../pages/workflows/Requests';
import Approvals from '../pages/workflows/Approvals';
import Forms from '../pages/forms/Forms';
import Tasks from '../pages/tasks/Tasks';
import DepartmentsPage from '../pages/departments/DepartmentsPage';
import EmployeesPage from '../pages/employees/EmployeesPage';
import SupportPage from '../pages/app/SupportPage';

// Platform Admin Pages
import PlatformDashboard from '../pages/admin/PlatformDashboard';
import PlatformOrganizations from '../pages/admin/PlatformOrganizations';
import PlatformUsers from '../pages/admin/PlatformUsers';
import PlatformRolesManagement from '../pages/admin/PlatformRolesManagement';
import PlatformPricing from '../pages/admin/PlatformPricing';
import PlatformSubscriptions from '../pages/admin/PlatformSubscriptions';
import PlatformTickets from '../pages/admin/PlatformTickets';
import PlatformAuditLogs from '../pages/admin/PlatformAuditLogs';
import PlatformSettings from '../pages/admin/PlatformSettings';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />

      {/* Guest Authentication Routes */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>

      {/* Public / Invitation Acceptance Route */}
      <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />

      {/* Protected Customer App Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="workflows" element={<Workflows />} />
          <Route path="forms" element={<Navigate to="/app/workflows" replace />} />
          <Route path="requests" element={<Requests />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/organization" element={<OrganizationSettings />} />
          <Route path="settings/invitations" element={<OrganizationInvitations />} />
          <Route path="settings/roles" element={<RolesManagement />} />
          <Route path="organizations/new" element={<CreateOrganization />} />
        </Route>
      </Route>

      {/* Protected Platform Admin Routes */}
      <Route
        path="/admin"
        element={
          <PlatformProtectedRoute>
            <AdminLayout />
          </PlatformProtectedRoute>
        }
      >
        <Route path="dashboard" element={<PlatformDashboard />} />
        <Route
          path="organizations"
          element={
            <PlatformProtectedRoute requiredPermission="organizations.view">
              <PlatformOrganizations />
            </PlatformProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <PlatformProtectedRoute requiredPermission="users.view">
              <PlatformUsers />
            </PlatformProtectedRoute>
          }
        />
        <Route
          path="roles"
          element={
            <PlatformProtectedRoute requiredPermission="roles.view">
              <PlatformRolesManagement />
            </PlatformProtectedRoute>
          }
        />
        <Route
          path="pricing"
          element={
            <PlatformProtectedRoute requiredPermission="pricing.view">
              <PlatformPricing />
            </PlatformProtectedRoute>
          }
        />
        <Route
          path="subscriptions"
          element={
            <PlatformProtectedRoute requiredPermission="subscriptions.view">
              <PlatformSubscriptions />
            </PlatformProtectedRoute>
          }
        />
        <Route
          path="tickets"
          element={
            <PlatformProtectedRoute requiredPermission="tickets.view">
              <PlatformTickets />
            </PlatformProtectedRoute>
          }
        />
        <Route
          path="audit"
          element={
            <PlatformProtectedRoute requiredPermission="audit.view">
              <PlatformAuditLogs />
            </PlatformProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <PlatformProtectedRoute requiredPermission="settings.view">
              <PlatformSettings />
            </PlatformProtectedRoute>
          }
        />
      </Route>

      {/* 404 Catch-all */}
      <Route path="*" element={<PlaceholderPage title="404 Not Found" />} />
    </Routes>
  );
};

export default AppRoutes;

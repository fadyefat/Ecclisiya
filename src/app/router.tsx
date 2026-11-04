import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { authService } from '../features/auth/services/authService';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { MembersPage } from '../features/members/pages/MembersPage';
import { AttendanceDaysPage } from '../features/attendance-days/pages/AttendanceDaysPage';
import { AttendanceDayDetailsPage } from '../features/attendance-days/pages/AttendanceDayDetailsPage';
import { EventsPage } from '../features/events/pages/EventsPage';
import { ReportsPage } from '../features/reports/pages/ReportsPage';
import { SettingsPage } from '../features/settings/pages/SettingsPage';

const RequireAdminAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RedirectIfAuthenticated: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  if (authService.isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <RedirectIfAuthenticated>
        <LoginPage />
      </RedirectIfAuthenticated>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAdminAuth>
        <AppShell />
      </RequireAdminAuth>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'members',
        element: <MembersPage />,
      },
      {
        path: 'attendance-days',
        element: <AttendanceDaysPage />,
      },
      {
        path: 'attendance-days/:id',
        element: <AttendanceDayDetailsPage />,
      },
      {
        path: 'events',
        element: <EventsPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);

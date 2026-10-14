import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { MembersPage } from '../features/members/pages/MembersPage';
import { AttendanceDaysPage } from '../features/attendance-days/pages/AttendanceDaysPage';
import { AttendanceDayDetailsPage } from '../features/attendance-days/pages/AttendanceDayDetailsPage';
import { EventsPage } from '../features/events/pages/EventsPage';
import { ReportsPage } from '../features/reports/pages/ReportsPage';
import { SettingsPage } from '../features/settings/pages/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
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

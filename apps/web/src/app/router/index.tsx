import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { MembersDirectoryPage } from '@/features/members/pages/MembersDirectoryPage';
import { MemberFormPage } from '@/features/members/pages/MemberFormPage';
import { MemberProfilePage } from '@/features/members/pages/MemberProfilePage';
import { AttendancePage } from '@/features/attendance/pages/AttendancePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
          {
            path: '/members',
            element: <MembersDirectoryPage />,
          },
          {
            path: '/members/new',
            element: <MemberFormPage />,
          },
          {
            path: '/members/:id',
            element: <MemberProfilePage />,
          },
          {
            path: '/members/:id/edit',
            element: <MemberFormPage />,
          },
          {
            path: '/attendance',
            element: <AttendancePage />,
          },
        ]
      }
    ]
  }
]);


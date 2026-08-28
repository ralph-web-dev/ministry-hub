import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/components/AuthProvider';

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // TODO: Replace with proper loading spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/components/AuthProvider';
import { PageLoader } from '@/components/ui/Skeleton';

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader text="Verifying authentication..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

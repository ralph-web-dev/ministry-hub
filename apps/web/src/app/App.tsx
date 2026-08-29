import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AuthProvider } from '@/features/auth/components/AuthProvider';
import { ToastProvider } from '@/components/ui/Toast';

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>
  );
}

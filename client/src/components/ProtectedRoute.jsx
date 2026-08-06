import { Navigate, useLocation, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Loader2 } from 'lucide-react';

/**
 * Protected route wrapper. Supports role-based access.
 * - If auth is still loading, show a spinner.
 * - If not authenticated, redirect to /login.
 * - If a role is required and user doesn't match, redirect home.
 *
 * Works in two modes:
 * - As a layout wrapper (`<Route element={<ProtectedRoute />}>...`)
 *   → renders an <Outlet /> for the nested routes.
 * - As an explicit children wrapper (`<ProtectedRoute><AdminLayout/></ProtectedRoute>`)
 *   → renders the passed children.
 */
export default function ProtectedRoute({ children, roles = null }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
}

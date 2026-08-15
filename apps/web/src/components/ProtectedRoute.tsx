import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './Spinner';

export const ProtectedRoute = ({ admin = false }: { admin?: boolean }) => {
  const { session, profile, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center cosmic-bg">
        <Spinner />
      </div>
    );
  if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!profile)
    return (
      <div className="grid min-h-screen place-items-center cosmic-bg">
        <p>Não foi possível carregar seu perfil.</p>
      </div>
    );
  if (admin && profile.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

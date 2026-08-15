import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../context/AuthContext';

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { session, profile, loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate('/login', { replace: true });
      return;
    }
    navigate(profile?.role === 'admin' ? '/mfa' : '/redefinir-senha', { replace: true });
  }, [loading, navigate, profile, session]);
  return (
    <div className="cosmic-bg grid min-h-screen place-items-center">
      <Spinner label="Confirmando seu acesso" />
    </div>
  );
};

import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAssuranceLevel } from '../services/auth';
import { Spinner } from './Spinner';

export const AdminRoute = () => {
  const [level, setLevel] = useState<'loading' | 'aal1' | 'aal2'>('loading');
  useEffect(() => {
    void getAssuranceLevel()
      .then((data) => setLevel(data.currentLevel === 'aal2' ? 'aal2' : 'aal1'))
      .catch(() => setLevel('aal1'));
  }, []);
  if (level === 'loading')
    return (
      <div className="grid min-h-screen place-items-center cosmic-bg">
        <Spinner label="Verificando segurança" />
      </div>
    );
  if (level !== 'aal2') return <Navigate to="/mfa" replace />;
  return <Outlet />;
};

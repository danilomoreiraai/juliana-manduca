import type { LucideIcon } from 'lucide-react';
import { CalendarDays, FileText, Home, LogOut, ShieldCheck, Users } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/cn';
import { signOut } from '../services/auth';
import { Brand } from './Brand';

export const DashboardShell = ({
  children,
  admin = false,
}: PropsWithChildren<{ admin?: boolean }>) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const links: Array<[LucideIcon, string, string]> = admin
    ? [
        [ShieldCheck, 'Visão geral', '/admin'],
        [Users, 'Clientes', '/admin#clientes'],
        [CalendarDays, 'Consultas', '/admin#consultas'],
        [FileText, 'Arquivos', '/admin#arquivos'],
      ]
    : [
        [Home, 'Visão geral', '/dashboard'],
        [CalendarDays, 'Consultas', '/dashboard#consultas'],
        [FileText, 'Arquivos', '/dashboard#arquivos'],
      ];
  const logout = async () => {
    await signOut();
    navigate('/');
  };
  return (
    <div className="dashboard-grid cosmic-bg">
      <aside className="border-b border-ivory-100/15 bg-ink-900/75 p-5 md:border-b-0 md:border-r md:p-7">
        <Brand />
        <nav className="mt-8 flex gap-2 overflow-auto md:flex-col" aria-label="Área privada">
          {links.map(([Icon, label, href]) => (
            <NavLink
              key={label}
              to={href}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-3 px-3 py-2.5 text-sm text-ivory-200 hover:bg-plum-700/30 hover:text-ivory-100',
                  isActive && 'bg-plum-700/45 text-gold-300',
                )
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 border-t border-ivory-100/15 pt-5 md:mt-[45vh]">
          <p className="truncate text-sm font-medium">{profile?.fullName}</p>
          <p className="muted truncate text-xs">{profile?.email}</p>
          <button
            onClick={() => void logout()}
            className="mt-4 inline-flex items-center gap-2 text-sm text-ivory-200 hover:text-red-200"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>
      <main className="min-w-0 p-5 md:p-10 lg:p-14">{children}</main>
    </div>
  );
};

import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brand } from './Brand';

export const SiteHeader = () => {
  const [open, setOpen] = useState(false);
  const links = [
    ['Atendimentos', '#atendimentos'],
    ['Como funciona', '#como-funciona'],
    ['Sobre', '#sobre'],
  ];
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/8 bg-ink-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Navegação principal">
          {links.map(([label, href]) => (
            <a key={href} href={href} className="text-sm text-ivory-200/75 hover:text-gold-300">
              {label}
            </a>
          ))}
          <Link
            to="/login"
            className="rounded-full border border-gold-500/45 px-5 py-2 text-sm text-gold-300 hover:bg-gold-500/10"
          >
            Área do cliente
          </Link>
        </nav>
        <button
          className="p-2 md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="Abrir menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav
          className="border-t border-white/8 bg-ink-950 p-5 md:hidden"
          aria-label="Navegação móvel"
        >
          <div className="flex flex-col gap-4">
            {links.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setOpen(false)}>
                {label}
              </a>
            ))}
            <Link to="/login">Área do cliente</Link>
          </div>
        </nav>
      )}
    </header>
  );
};

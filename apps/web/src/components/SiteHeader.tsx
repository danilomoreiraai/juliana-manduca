import { Menu, X } from 'lucide-react';
import { AnimatePresence, m, useScroll } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brand } from './Brand';

export const SiteHeader = () => {
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const links = [
    ['Atendimentos', '#atendimentos'],
    ['Como funciona', '#como-funciona'],
    ['Sobre', '#sobre'],
  ];
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-ivory-100/18 bg-ink-950/94 backdrop-blur-sm">
      <m.div className="scroll-progress" style={{ scaleX: scrollYProgress }} />
      <div className="mx-auto flex h-24 max-w-[1500px] items-center justify-between px-5 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Navegação principal">
          {links.map(([label, href]) => (
            <a key={href} href={href} className="nav-link">
              {label}
            </a>
          ))}
          <Link to="/login" className="button-outline min-h-11 px-5">
            Área do cliente
          </Link>
        </nav>
        <button
          className="p-2 lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="Abrir menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <m.nav
            className="border-t border-ivory-100/18 bg-ink-950 p-5 lg:hidden"
            aria-label="Navegação móvel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-col gap-5 font-mono text-xs uppercase tracking-[0.12em]">
              {links.map(([label, href]) => (
                <a key={href} href={href} onClick={() => setOpen(false)}>
                  {label}
                </a>
              ))}
              <Link to="/login" onClick={() => setOpen(false)}>
                Área do cliente
              </Link>
            </div>
          </m.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

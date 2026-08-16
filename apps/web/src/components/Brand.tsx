import { Link } from 'react-router-dom';

export const Brand = ({ compact = false }: { compact?: boolean }) => (
  <Link
    to="/"
    className="brand-lockup inline-flex items-center gap-3"
    aria-label="Juliana Manduca — início"
  >
    <span className="brand-monogram" aria-hidden="true">
      JM
    </span>
    {!compact && (
      <span className="leading-none text-ivory-100">
        <span className="block text-base font-extrabold uppercase tracking-[-0.04em] sm:text-lg">
          Juliana Manduca
        </span>
        <span className="mt-1 block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-gold-300">
          Astrologia consciente
        </span>
      </span>
    )}
  </Link>
);

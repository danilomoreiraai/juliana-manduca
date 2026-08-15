import { Link } from 'react-router-dom';

export const Brand = ({ compact = false }: { compact?: boolean }) => (
  <Link to="/" className="inline-flex items-center gap-3" aria-label="Juliana Manduca — início">
    <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden="true">
      <rect width="48" height="48" rx="14" fill="#201c2d" stroke="rgba(215,180,106,.5)" />
      <path
        d="M11 13h6v16c0 5-3 8-8 8v-5c2 0 2-1 2-3V13Zm11 0h6l4 10 5-10h5v24h-6V25l-4 9-4-9v12h-6V13Z"
        fill="#d7b46a"
      />
    </svg>
    {!compact && (
      <span className="display text-xl leading-none text-ivory-100">
        Juliana <span className="text-gold-300">Manduca</span>
      </span>
    )}
  </Link>
);

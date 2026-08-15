import { config } from '../config';
import { Brand } from './Brand';

export const SiteFooter = () => (
  <footer className="border-t border-white/8 bg-ink-950 px-5 py-12">
    <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-end">
      <div>
        <Brand />
        <p className="muted mt-4 max-w-md text-sm">
          Astrologia como linguagem de consciência, presença e escolha.
        </p>
      </div>
      <div className="flex flex-col gap-3 text-sm text-ivory-200/65 md:items-end">
        <a
          href={config.instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 hover:text-gold-300"
        >
          <span aria-hidden="true">◎</span> @juliana.manduca
        </a>
        <span>© {new Date().getFullYear()} Juliana Manduca</span>
      </div>
    </div>
  </footer>
);

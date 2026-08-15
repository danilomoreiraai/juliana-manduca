import { Link } from 'react-router-dom';
import { Brand } from '../components/Brand';

export const NotFoundPage = () => (
  <div className="cosmic-bg grid min-h-screen place-items-center px-5">
    <main className="text-center">
      <div className="flex justify-center">
        <Brand />
      </div>
      <p className="eyebrow mt-12">Erro 404</p>
      <h1 className="display mt-4 text-6xl">Esta constelação não existe.</h1>
      <p className="muted mx-auto mt-4 max-w-md">
        A página que você procura mudou de lugar ou nunca esteve por aqui.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex rounded-full bg-gold-500 px-6 py-3 font-semibold text-ink-950"
      >
        Voltar ao início
      </Link>
    </main>
  </div>
);

import type { HelenaNatalInput, HelenaNatalResult } from '@juliana/contracts';
import { useMutation } from '@tanstack/react-query';
import { Orbit } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DashboardShell } from '../components/DashboardShell';
import { HelenaForm } from '../components/helena/HelenaForm';
import { HelenaResults } from '../components/helena/HelenaResults';
import { calculateNatal } from '../services/helena';

export const HelenaPage = () => {
  const revision = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const [result, setResult] = useState<{ chart: HelenaNatalResult; name: string } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => () => controller.current?.abort(), []);
  const mutation = useMutation({
    mutationFn: (variables: {
      input: HelenaNatalInput;
      name: string;
      revision: number;
      signal: AbortSignal;
    }) => calculateNatal(variables.input, variables.signal),
    onSuccess: (chart, variables) => {
      if (revision.current === variables.revision && !variables.signal.aborted)
        setResult({ chart, name: variables.name });
    },
    onError: (caught, variables) => {
      if (revision.current === variables.revision && !variables.signal.aborted)
        setError(caught instanceof Error ? caught.message : 'Não foi possível calcular o mapa.');
    },
    retry: false,
  });
  const edit = () => {
    revision.current++;
    controller.current?.abort();
    mutation.reset();
    setResult(null);
    setError('');
  };
  const calculate = (input: HelenaNatalInput, name: string) => {
    controller.current?.abort();
    controller.current = new AbortController();
    revision.current++;
    setResult(null);
    setError('');
    mutation.mutate({ input, name, revision: revision.current, signal: controller.current.signal });
  };
  return (
    <DashboardShell admin>
      <header className="mb-8">
        <p className="eyebrow">Ateliê de astrologia · Administração</p>
        <h1 className="display mt-3 text-5xl">HELENA</h1>
        <p className="muted mt-4 max-w-2xl">
          Calcule o mapa natal e revise posições, casas e aspectos para preparar seus conteúdos.
        </p>
      </header>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.4fr)]">
        <div className="min-w-0">
          <HelenaForm pending={mutation.isPending} onEdit={edit} onCalculate={calculate} />
          {error && (
            <p className="mt-4 rounded-xl border border-gold-500 p-4 text-sm" role="alert">
              {error}
            </p>
          )}
          <p className="muted mt-4 text-xs">
            Esta etapa permite cálculo e exportação local. Salvar mapas e enviar materiais aos
            clientes serão as próximas integrações.
          </p>
        </div>
        {result ? (
          <HelenaResults chart={result.chart} name={result.name} />
        ) : (
          <section
            className="panel grid min-h-80 place-items-center p-8 text-center"
            aria-live="polite"
          >
            <div>
              <Orbit className="mx-auto mb-5 text-gold-300" size={44} aria-hidden="true" />
              <h2 className="display text-2xl">O mapa começa aqui.</h2>
              <p className="muted mt-3 max-w-sm text-sm">
                {mutation.isPending
                  ? 'Calculando as posições do céu…'
                  : 'Preencha os dados e calcule para visualizar a mandala e as tabelas.'}
              </p>
            </div>
          </section>
        )}
      </div>
    </DashboardShell>
  );
};

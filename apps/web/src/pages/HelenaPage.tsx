import type { HelenaDraft, HelenaNatalInput, HelenaNatalResult } from '@juliana/contracts';
import { useMutation } from '@tanstack/react-query';
import { Orbit } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../components/Button';
import { DashboardShell } from '../components/DashboardShell';
import { HelenaDraftPanel } from '../components/helena/HelenaDraftPanel';
import { HelenaForm } from '../components/helena/HelenaForm';
import { HelenaLibrary } from '../components/helena/HelenaLibrary';
import { HelenaResults } from '../components/helena/HelenaResults';
import { calculateNatal } from '../services/helena';

export const HelenaPage = () => {
  const [saved, setSaved] = useState<HelenaDraft | null>(null);
  const [creationId, setCreationId] = useState(() => crypto.randomUUID());
  const [formEpoch, setFormEpoch] = useState(0);
  const [contentBusy, setContentBusy] = useState(false);
  const dirty = useRef(false);
  const onDirty = useCallback((value: boolean) => {
    dirty.current = value;
  }, []);
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
    dirty.current = true;
    revision.current++;
    controller.current?.abort();
    mutation.reset();
    setResult(null);
    setError('');
  };
  const openSaved = (draft: HelenaDraft) => {
    if (dirty.current && !window.confirm('Há alterações não salvas. Descartar e abrir este mapa?'))
      return;
    revision.current++;
    controller.current?.abort();
    mutation.reset();
    setError('');
    setSaved(draft);
    setResult({ chart: draft.result, name: draft.subjectName });
    setFormEpoch((value) => value + 1);
    dirty.current = false;
  };
  const onSaved = (draft: HelenaDraft) => {
    setSaved(draft);
    setResult({ chart: draft.result, name: draft.subjectName });
    dirty.current = false;
  };
  const newMap = () => {
    if (
      dirty.current &&
      !window.confirm('Há alterações não salvas. Descartar e iniciar outro mapa?')
    )
      return;
    edit();
    setSaved(null);
    setCreationId(crypto.randomUUID());
    setFormEpoch((value) => value + 1);
    dirty.current = false;
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
        <Button
          className="mt-4"
          variant="secondary"
          disabled={contentBusy || mutation.isPending}
          onClick={newMap}
        >
          Novo mapa
        </Button>
        <p className="muted mt-4 max-w-2xl">
          Calcule o mapa natal e revise posições, casas e aspectos para preparar seus conteúdos.
        </p>
      </header>
      <HelenaLibrary
        onOpen={openSaved}
        onBusy={setContentBusy}
        disabled={contentBusy || mutation.isPending}
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.4fr)]">
        <div className="min-w-0">
          <HelenaForm
            key={`${formEpoch}:${saved?.id ?? 'new'}:${saved?.revision ?? 0}`}
            pending={mutation.isPending}
            disabled={contentBusy}
            {...(saved ? { initial: { input: saved.result.input, name: saved.subjectName } } : {})}
            onEdit={edit}
            onCalculate={calculate}
          />
          <HelenaDraftPanel
            key={`${saved?.id ?? creationId}:${saved?.revision ?? 0}`}
            chart={result?.chart ?? null}
            disabled={contentBusy || mutation.isPending}
            name={result?.name ?? saved?.subjectName ?? ''}
            saved={saved}
            creationId={creationId}
            onSaved={onSaved}
            onBusy={setContentBusy}
            onDirty={onDirty}
          />
          {error && (
            <p className="mt-4 rounded-xl border border-gold-500 p-4 text-sm" role="alert">
              {error}
            </p>
          )}
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

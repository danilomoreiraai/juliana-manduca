import type { HelenaDraft } from '@juliana/contracts';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getHelenaDraft, listHelenaDrafts } from '../../services/helena-drafts';
import { Button } from '../Button';

export const HelenaLibrary = ({
  onOpen,
  disabled,
  onBusy,
}: {
  onOpen: (draft: HelenaDraft) => void;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
}) => {
  const [offset, setOffset] = useState(0);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['helena-library', offset],
    queryFn: () => listHelenaDrafts(offset),
  });
  const open = async (id: string) => {
    setOpening(true);
    onBusy(true);
    setError('');
    try {
      onOpen(await getHelenaDraft(id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível reabrir o mapa.');
    } finally {
      setOpening(false);
      onBusy(false);
    }
  };
  return (
    <details className="panel mb-6 p-5 md:p-7">
      <summary className="display cursor-pointer text-xl">Mapas salvos</summary>
      {query.isPending && (
        <p className="muted mt-4" role="status">
          Carregando mapas…
        </p>
      )}
      {query.isError && (
        <p className="field-error mt-4" role="alert">
          Não foi possível carregar os mapas.{' '}
          <button className="underline" onClick={() => void query.refetch()}>
            Tentar novamente
          </button>
        </p>
      )}
      {query.data && (
        <div className="mt-4 space-y-3">
          {!query.data.items.length && <p className="muted text-sm">Nenhum mapa salvo ainda.</p>}
          {query.data.items.map((draft) => (
            <div
              key={draft.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-ivory-100/15 pb-3"
            >
              <div className="min-w-0">
                <p className="break-words font-medium">{draft.title}</p>
                <p className="muted break-words text-xs">
                  {draft.subjectName} · versão {draft.revision} ·{' '}
                  {draft.report?.documentId ? 'Disponível ao cliente' : 'Rascunho'}
                </p>
              </div>
              <Button
                variant="secondary"
                disabled={disabled || opening}
                onClick={() => void open(draft.id)}
                aria-label={`Abrir ${draft.title}`}
              >
                Abrir
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              disabled={!offset || disabled || opening}
              onClick={() => setOffset(Math.max(0, offset - 25))}
            >
              Anterior
            </Button>
            <p className="muted text-xs">{query.data.total} mapa(s)</p>
            <Button
              variant="secondary"
              disabled={offset + 25 >= query.data.total || disabled || opening}
              onClick={() => setOffset(offset + 25)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p className="field-error mt-4" role="alert">
          {error}
        </p>
      )}
    </details>
  );
};

import {
  type HelenaDraft,
  type HelenaNatalResult,
  type HelenaPreview,
  helenaCreateDraftSchema,
} from '@juliana/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  createHelenaDraft,
  getHelenaDraft,
  previewHelenaReport,
  publishHelenaReport,
  searchHelenaClients,
  updateHelenaDraft,
} from '../../services/helena-drafts';
import { Button } from '../Button';

type Props = {
  chart: HelenaNatalResult | null;
  disabled?: boolean;
  name: string;
  saved: HelenaDraft | null;
  creationId: string;
  onSaved: (draft: HelenaDraft) => void;
  onBusy: (busy: boolean) => void;
  onDirty: (dirty: boolean) => void;
};

export const HelenaDraftPanel = ({
  chart,
  disabled = false,
  name,
  saved,
  creationId,
  onSaved,
  onBusy,
  onDirty,
}: Props) => {
  const [clientId, setClientId] = useState(saved?.clientId ?? '');
  const [title, setTitle] = useState(
    saved?.title ?? (name ? `Mapa natal de ${name}` : 'Mapa natal'),
  );
  const [analysis, setAnalysis] = useState(saved?.analysis ?? '');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [changed, setChanged] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<HelenaPreview | null>(null);
  const [opened, setOpened] = useState(false);
  const [approved, setApproved] = useState(false);
  const queryClient = useQueryClient();
  const clients = useQuery({
    queryKey: ['helena-clients', debounced],
    queryFn: () => searchHelenaClients(debounced),
  });
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const dirty =
    changed ||
    Boolean(chart && !saved) ||
    Boolean(
      saved &&
      (!chart ||
        name !== saved.subjectName ||
        JSON.stringify(chart.input) !== JSON.stringify(saved.result.input)),
    );
  const needsSave = !saved || dirty;
  useEffect(() => {
    onDirty(dirty);
  }, [dirty, onDirty]);
  useEffect(() => () => onBusy(false), [onBusy]);
  const action = useMutation({
    mutationFn: (run: () => Promise<void>) => run(),
    retry: false,
    onMutate: () => {
      onBusy(true);
      setError('');
    },
    onError: (caught) =>
      setError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível concluir esta etapa. Tente novamente.',
      ),
    onSettled: () => onBusy(false),
  });
  const edit = (update: () => void) => {
    update();
    setChanged(true);
    setPreview(null);
    setOpened(false);
    setApproved(false);
    setError('');
  };
  const save = () => {
    if (!chart) return;
    const input = helenaCreateDraftSchema.safeParse({
      id: saved?.id ?? creationId,
      clientId,
      title,
      subjectName: name,
      analysis,
      natal: chart.input,
    });
    if (!input.success) {
      setError('Selecione um cliente ativo, informe o título e confira os limites dos campos.');
      return;
    }
    action.mutate(async () => {
      const { id, ...content } = input.data;
      const draft = saved
        ? await updateHelenaDraft(id, { ...content, revision: saved.revision })
        : await createHelenaDraft(input.data);
      await queryClient.invalidateQueries({ queryKey: ['helena-library'] });
      onSaved(draft);
    });
  };
  const generate = () => {
    if (!saved || needsSave) return;
    action.mutate(async () => {
      const next = await previewHelenaReport(saved.id, saved.revision);
      setPreview(next);
      setOpened(false);
      setApproved(false);
    });
  };
  const publish = () => {
    if (!saved || !preview || !opened || !approved || needsSave || saved.report?.publishedAt)
      return;
    action.mutate(async () => {
      await publishHelenaReport(saved.id, { revision: saved.revision, reportId: preview.reportId });
      const current = await getHelenaDraft(saved.id);
      await queryClient.invalidateQueries({ queryKey: ['helena-library'] });
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      onSaved(current);
    });
  };
  const activeClients = clients.data?.items.filter((client) => client.status === 'active') ?? [];
  return (
    <section className="panel mt-6 p-5 md:p-7" aria-labelledby="draft-heading">
      <p className="eyebrow">Conteúdo e entrega</p>
      <h2 id="draft-heading" className="display mt-2 text-2xl">
        Prepare seu material.
      </h2>
      <p className="muted mt-3 text-sm">
        {saved
          ? `Versão salva: ${saved.revision}${dirty ? ' · alterações ainda não salvas' : ''}`
          : 'Salve o mapa para preparar o PDF.'}
      </p>
      <fieldset className="mt-5 space-y-4" disabled={action.isPending || disabled}>
        <div>
          <label className="label" htmlFor="helena-client-search">
            Buscar cliente
          </label>
          <input
            id="helena-client-search"
            className="input"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome ou e-mail"
          />
        </div>
        <div>
          <label className="label" htmlFor="helena-client">
            Cliente destinatário
          </label>
          <select
            className="input"
            id="helena-client"
            value={clientId}
            onChange={(event) => edit(() => setClientId(event.target.value))}
          >
            <option value="">
              {clients.isPending ? 'Carregando clientes…' : 'Selecione um cliente ativo'}
            </option>
            {clientId && !activeClients.some((client) => client.id === clientId) && (
              <option value={clientId}>Cliente vinculado</option>
            )}
            {activeClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.fullName}
              </option>
            ))}
          </select>
          {clients.isError && (
            <p className="field-error" role="alert">
              Não foi possível buscar clientes.{' '}
              <button type="button" className="underline" onClick={() => void clients.refetch()}>
                Tentar novamente
              </button>
            </p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="helena-title">
            Título do material
          </label>
          <input
            id="helena-title"
            className="input"
            maxLength={160}
            value={title}
            onChange={(event) => edit(() => setTitle(event.target.value))}
          />
        </div>
        <div>
          <label className="label" htmlFor="helena-analysis">
            Análise para o cliente
          </label>
          <textarea
            id="helena-analysis"
            className="input min-h-48"
            maxLength={20000}
            value={analysis}
            onChange={(event) => edit(() => setAnalysis(event.target.value))}
          />
          <p className="muted mt-1 text-xs">
            {analysis.length}/20.000 caracteres · texto escrito e revisado por você.
          </p>
        </div>
        <Button type="button" onClick={save} disabled={!chart || !needsSave} className="w-full">
          {action.isPending ? 'Processando…' : 'Salvar mapa'}
        </Button>
        {!chart && <p className="muted text-xs">Calcule o mapa para salvar o conteúdo.</p>}
        <div className="space-y-4 border-t border-ivory-100/15 pt-5">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={generate}
            disabled={needsSave}
          >
            Gerar PDF para revisão
          </Button>
          {preview && !needsSave && (
            <div className="space-y-4">
              <a
                href={preview.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-sm underline"
                onClick={() => setOpened(true)}
              >
                Abrir PDF para revisão
              </a>
              <p className="muted text-xs">
                O link vale por cinco minutos. Gere o link novamente se ele expirar.
              </p>
              {!saved?.report?.publishedAt && (
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 size-5 shrink-0"
                    checked={approved}
                    disabled={!opened}
                    onChange={(event) => setApproved(event.target.checked)}
                  />
                  Abri e revisei este PDF para liberar ao cliente selecionado.
                </label>
              )}
            </div>
          )}
          {saved?.report?.publishedAt ? (
            <p role="status" className="text-sm">
              {saved.report.documentId
                ? 'Material disponível nos arquivos privados do cliente.'
                : 'Material removido. Salve uma nova revisão para preparar outro PDF.'}
            </p>
          ) : (
            <Button
              type="button"
              className="w-full"
              onClick={publish}
              disabled={needsSave || !preview || !opened || !approved}
            >
              Liberar para o cliente
            </Button>
          )}
        </div>
      </fieldset>
      {error && (
        <p className="field-error mt-4" role="alert">
          {error}
        </p>
      )}
    </section>
  );
};

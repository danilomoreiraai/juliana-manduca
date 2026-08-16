import { useMutation, useQuery } from '@tanstack/react-query';
import { CalendarDays, Download, FileText, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { DashboardShell } from '../components/DashboardShell';
import { ContentSkeleton, SkeletonBlock } from '../components/MotionPrimitives';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import {
  getConsultations,
  getDocuments,
  requestDocumentDownload,
  updateProfile,
} from '../services/portal';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(
    new Date(value),
  );
const formatBytes = (bytes: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'unit',
    unit: bytes >= 1_000_000 ? 'megabyte' : 'kilobyte',
    maximumFractionDigits: 1,
  }).format(bytes / (bytes >= 1_000_000 ? 1_000_000 : 1_000));

export const DashboardPage = () => {
  const { profile, refreshProfile } = useAuth();
  const consultations = useQuery({ queryKey: ['consultations'], queryFn: getConsultations });
  const documents = useQuery({ queryKey: ['documents'], queryFn: getDocuments });
  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [message, setMessage] = useState('');
  const update = useMutation({
    mutationFn: () => updateProfile({ fullName }),
    onSuccess: async () => {
      await refreshProfile();
      setMessage('Perfil atualizado.');
    },
  });
  const download = useMutation({
    mutationFn: requestDocumentDownload,
    onSuccess: ({ url }) => {
      window.location.assign(url);
    },
  });
  const upcoming = consultations.data
    ?.filter((item) => item.status === 'scheduled' && new Date(item.scheduledAt) >= new Date())
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];
  return (
    <DashboardShell>
      <header>
        <p className="eyebrow">Área do cliente</p>
        <h1 className="display mt-3 text-5xl">Olá, {profile?.fullName.split(' ')[0]}.</h1>
        <p className="muted mt-3">Aqui estão suas consultas e materiais compartilhados.</p>
      </header>
      <section className="mt-10 grid gap-5 lg:grid-cols-3">
        <article className="panel rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center gap-3 text-gold-300">
            <CalendarDays size={19} />
            <span className="text-sm">Próxima consulta</span>
          </div>
          {consultations.isLoading ? (
            <div className="mt-6">
              <SkeletonBlock className="h-8 w-2/5" />
              <SkeletonBlock className="mt-3 h-4 w-3/5" />
            </div>
          ) : upcoming ? (
            <div className="mt-6">
              <h2 className="display text-3xl">{upcoming.title}</h2>
              <p className="muted mt-2">{formatDate(upcoming.scheduledAt)}</p>
            </div>
          ) : (
            <p className="muted mt-6">Nenhuma consulta agendada no momento.</p>
          )}
        </article>
        <article className="panel rounded-2xl p-6">
          <div className="flex items-center gap-3 text-gold-300">
            <FileText size={19} />
            <span className="text-sm">Materiais</span>
          </div>
          {documents.isLoading ? (
            <SkeletonBlock className="mt-6 h-10 w-16" />
          ) : (
            <p className="display mt-6 text-4xl">{documents.data?.length ?? 0}</p>
          )}
          <p className="muted text-sm">arquivos disponíveis</p>
        </article>
      </section>
      <section id="consultas" className="mt-12">
        <h2 className="display text-3xl">Suas consultas</h2>
        <div className="mt-5 space-y-3">
          {consultations.isLoading ? (
            <ContentSkeleton rows={3} />
          ) : consultations.data?.length ? (
            consultations.data.map((item) => (
              <article
                key={item.id}
                className="panel flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
              >
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="muted mt-1 text-sm">{formatDate(item.scheduledAt)}</p>
                  {item.summary && <p className="muted mt-3 max-w-2xl text-sm">{item.summary}</p>}
                </div>
                <span className="w-fit bg-plum-700/45 px-3 py-1 text-xs capitalize text-gold-300">
                  {item.status === 'scheduled'
                    ? 'agendada'
                    : item.status === 'completed'
                      ? 'concluída'
                      : 'cancelada'}
                </span>
              </article>
            ))
          ) : (
            <div className="panel p-7 text-center muted">Seu histórico aparecerá aqui.</div>
          )}
        </div>
      </section>
      <section id="arquivos" className="mt-12">
        <h2 className="display text-3xl">Materiais privados</h2>
        <p className="muted mt-2 text-sm">Links de download expiram após cinco minutos.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {documents.isLoading ? (
            <div className="md:col-span-2">
              <ContentSkeleton rows={2} />
            </div>
          ) : (
            documents.data?.map((document) => (
              <article
                key={document.id}
                className="panel flex items-center justify-between gap-4 p-5"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{document.displayName}</p>
                  <p className="muted mt-1 text-xs">{formatBytes(document.sizeBytes)}</p>
                </div>
                <Button
                  variant="secondary"
                  className="shrink-0 px-4"
                  onClick={() => download.mutate(document.id)}
                  disabled={download.isPending}
                  aria-busy={download.isPending}
                  aria-label={`Baixar ${document.displayName}`}
                >
                  {download.isPending ? <Spinner label="Preparando" /> : <Download size={17} />}
                </Button>
              </article>
            ))
          )}
        </div>
      </section>
      <section className="mt-12">
        <div className="mb-5 flex items-center gap-3">
          <UserRound className="text-gold-300" />
          <h2 className="display text-3xl">Seu perfil</h2>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            update.mutate();
          }}
          className="panel max-w-xl rounded-2xl p-6"
        >
          <label className="label" htmlFor="fullName">
            Nome
          </label>
          <input
            id="fullName"
            className="input"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            minLength={2}
            required
          />
          <label className="label mt-4" htmlFor="profileEmail">
            E-mail
          </label>
          <input id="profileEmail" className="input" value={profile?.email ?? ''} disabled />
          <div className="mt-5 flex items-center gap-4">
            <Button disabled={update.isPending} aria-busy={update.isPending}>
              {update.isPending ? <Spinner label="Salvando" /> : 'Salvar perfil'}
            </Button>
            {message && <span className="text-sm text-green-200">{message}</span>}
          </div>
        </form>
      </section>
    </DashboardShell>
  );
};

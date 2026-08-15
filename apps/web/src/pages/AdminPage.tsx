import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, FileUp, UserPlus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { DashboardShell } from '../components/DashboardShell';
import {
  createAdminConsultation,
  deleteAdminConsultation,
  deleteAdminDocument,
  getAdminConsultations,
  getAdminDocuments,
  getAdminUsers,
  inviteAdminUser,
  setAdminUserStatus,
  updateAdminConsultation,
  uploadAdminDocument,
} from '../services/portal';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(value),
  );

export const AdminPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [notice, setNotice] = useState('');
  const users = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => getAdminUsers(search),
  });
  const consultations = useQuery({
    queryKey: ['admin-consultations'],
    queryFn: getAdminConsultations,
  });
  const documents = useQuery({
    queryKey: ['admin-documents', selectedUserId],
    queryFn: () => getAdminDocuments(selectedUserId),
    enabled: Boolean(selectedUserId),
  });
  const activeUsers = users.data?.items.filter((user) => user.status === 'active').length ?? 0;
  const futureConsultations =
    consultations.data?.filter(
      (item) => item.status === 'scheduled' && new Date(item.scheduledAt) > new Date(),
    ).length ?? 0;
  const allClients = users.data?.items ?? [];
  const selectedConsultations = useMemo(
    () => consultations.data?.filter((item) => item.userId === selectedUserId) ?? [],
    [consultations.data, selectedUserId],
  );

  const invite = useMutation({
    mutationFn: inviteAdminUser,
    onSuccess: async () => {
      setNotice('Convite enviado.');
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
  const status = useMutation({
    mutationFn: ({ id, value }: { id: string; value: 'active' | 'disabled' }) =>
      setAdminUserStatus(id, { status: value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });
  const createConsultation = useMutation({
    mutationFn: createAdminConsultation,
    onSuccess: async () => {
      setNotice('Consulta criada.');
      await queryClient.invalidateQueries({ queryKey: ['admin-consultations'] });
    },
  });
  const updateConsultation = useMutation({
    mutationFn: ({ id, state }: { id: string; state: 'completed' | 'cancelled' }) =>
      updateAdminConsultation(id, { status: state }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-consultations'] }),
  });
  const removeConsultation = useMutation({
    mutationFn: deleteAdminConsultation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-consultations'] }),
  });
  const upload = useMutation({
    mutationFn: uploadAdminDocument,
    onSuccess: async () => {
      setNotice('Arquivo disponibilizado.');
      await queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
    },
  });
  const removeDocument = useMutation({
    mutationFn: deleteAdminDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-documents'] }),
  });

  const submitInvite = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    invite.mutate({ fullName: String(form.get('fullName')), email: String(form.get('email')) });
    event.currentTarget.reset();
  };
  const submitConsultation = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    createConsultation.mutate({
      userId: String(form.get('userId')),
      title: String(form.get('title')),
      scheduledAt: new Date(String(form.get('scheduledAt'))).toISOString(),
      status: 'scheduled',
      summary: String(form.get('summary')) || null,
    });
    event.currentTarget.reset();
  };
  const submitDocument = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get('file');
    if (!(file instanceof File) || !file.size) return;
    const consultationId = String(form.get('consultationId') ?? '');
    upload.mutate({
      userId: selectedUserId,
      displayName: String(form.get('displayName')),
      file,
      ...(consultationId ? { consultationId } : {}),
    });
    event.currentTarget.reset();
  };

  const error =
    invite.error ??
    status.error ??
    createConsultation.error ??
    updateConsultation.error ??
    upload.error;
  return (
    <DashboardShell admin>
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Administração</p>
          <h1 className="display mt-3 text-5xl">Visão geral</h1>
          <p className="muted mt-2">Clientes, consultas e materiais em um só lugar.</p>
        </div>
        {notice && (
          <p className="rounded-xl bg-green-950/40 px-4 py-2 text-sm text-green-100">{notice}</p>
        )}
      </header>
      {error && (
        <p role="alert" className="mt-5 rounded-xl bg-red-950/50 p-3 text-sm text-red-100">
          {error instanceof Error ? error.message : 'Não foi possível concluir a ação'}
        </p>
      )}
      <section className="mt-9 grid gap-4 sm:grid-cols-3">
        <article className="panel rounded-2xl p-5">
          <Users className="text-gold-300" size={20} />
          <p className="display mt-5 text-4xl">{users.data?.total ?? 0}</p>
          <p className="muted text-sm">clientes cadastrados</p>
        </article>
        <article className="panel rounded-2xl p-5">
          <CalendarDays className="text-gold-300" size={20} />
          <p className="display mt-5 text-4xl">{futureConsultations}</p>
          <p className="muted text-sm">consultas futuras</p>
        </article>
        <article className="panel rounded-2xl p-5">
          <Users className="text-gold-300" size={20} />
          <p className="display mt-5 text-4xl">{activeUsers}</p>
          <p className="muted text-sm">clientes ativos</p>
        </article>
      </section>

      <section id="clientes" className="mt-14 scroll-mt-6">
        <div className="flex items-center gap-3">
          <UserPlus className="text-gold-300" />
          <h2 className="display text-3xl">Clientes</h2>
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-[.75fr_1.25fr]">
          <form onSubmit={submitInvite} className="panel h-fit rounded-2xl p-6">
            <h3 className="font-semibold">Convidar cliente</h3>
            <div className="mt-5">
              <label className="label" htmlFor="inviteName">
                Nome
              </label>
              <input id="inviteName" name="fullName" className="input" minLength={2} required />
            </div>
            <div className="mt-4">
              <label className="label" htmlFor="inviteEmail">
                E-mail
              </label>
              <input id="inviteEmail" name="email" type="email" className="input" required />
            </div>
            <Button className="mt-5 w-full" disabled={invite.isPending}>
              {invite.isPending ? 'Enviando…' : 'Enviar convite'}
            </Button>
          </form>
          <div>
            <input
              aria-label="Buscar clientes"
              className="input mb-3"
              placeholder="Buscar por nome ou e-mail"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="space-y-2">
              {allClients.map((user) => (
                <article
                  key={user.id}
                  className="panel flex flex-col justify-between gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
                >
                  <button className="min-w-0 text-left" onClick={() => setSelectedUserId(user.id)}>
                    <p className="truncate font-medium">{user.fullName}</p>
                    <p className="muted truncate text-xs">{user.email}</p>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white/6 px-3 py-1 text-xs">{user.status}</span>
                    <Button
                      variant="secondary"
                      className="min-h-9 px-3 py-1 text-xs"
                      onClick={() =>
                        status.mutate({
                          id: user.id,
                          value: user.status === 'disabled' ? 'active' : 'disabled',
                        })
                      }
                    >
                      {user.status === 'disabled' ? 'Ativar' : 'Desativar'}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="consultas" className="mt-14 scroll-mt-6">
        <h2 className="display text-3xl">Consultas</h2>
        <div className="mt-5 grid gap-5 xl:grid-cols-[.75fr_1.25fr]">
          <form onSubmit={submitConsultation} className="panel h-fit rounded-2xl p-6">
            <h3 className="font-semibold">Nova consulta</h3>
            <label className="label mt-5" htmlFor="consultationUser">
              Cliente
            </label>
            <select id="consultationUser" name="userId" className="input" required defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              {allClients.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName}
                </option>
              ))}
            </select>
            <label className="label mt-4" htmlFor="consultationTitle">
              Título
            </label>
            <input
              id="consultationTitle"
              name="title"
              className="input"
              required
              minLength={3}
              placeholder="Ex.: Mapa natal"
            />
            <label className="label mt-4" htmlFor="scheduledAt">
              Data e hora
            </label>
            <input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              className="input"
              required
            />
            <label className="label mt-4" htmlFor="summary">
              Resumo visível
            </label>
            <textarea id="summary" name="summary" className="input min-h-24" maxLength={2000} />
            <Button className="mt-5 w-full" disabled={createConsultation.isPending}>
              Criar consulta
            </Button>
          </form>
          <div className="space-y-2">
            {consultations.data?.map((item) => (
              <article key={item.id} className="panel rounded-2xl p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="muted mt-1 text-xs">
                      {item.clientName} · {formatDate(item.scheduledAt)}
                    </p>
                  </div>
                  <span className="h-fit rounded-full bg-white/6 px-3 py-1 text-xs">
                    {item.status}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="min-h-8 px-3 py-1 text-xs"
                    onClick={() => updateConsultation.mutate({ id: item.id, state: 'completed' })}
                  >
                    Concluir
                  </Button>
                  <Button
                    variant="secondary"
                    className="min-h-8 px-3 py-1 text-xs"
                    onClick={() => updateConsultation.mutate({ id: item.id, state: 'cancelled' })}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="danger"
                    className="min-h-8 px-3 py-1 text-xs"
                    onClick={() => removeConsultation.mutate(item.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="arquivos" className="mt-14 scroll-mt-6">
        <div className="flex items-center gap-3">
          <FileUp className="text-gold-300" />
          <h2 className="display text-3xl">Arquivos</h2>
        </div>
        <p className="muted mt-2 text-sm">
          Selecione um cliente na lista acima para gerenciar seus materiais.
        </p>
        {selectedUserId && (
          <div className="mt-5 grid gap-5 xl:grid-cols-[.75fr_1.25fr]">
            <form onSubmit={submitDocument} className="panel h-fit rounded-2xl p-6">
              <h3 className="font-semibold">Disponibilizar arquivo</h3>
              <label className="label mt-5" htmlFor="displayName">
                Nome exibido
              </label>
              <input
                id="displayName"
                name="displayName"
                className="input"
                required
                maxLength={180}
              />
              <label className="label mt-4" htmlFor="consultationId">
                Consulta relacionada
              </label>
              <select id="consultationId" name="consultationId" className="input">
                <option value="">Nenhuma</option>
                {selectedConsultations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
              <label className="label mt-4" htmlFor="file">
                Arquivo (máx. 50 MB)
              </label>
              <input
                id="file"
                name="file"
                type="file"
                className="input"
                accept="application/pdf,image/jpeg,image/png,image/webp,audio/mpeg,audio/mp4,audio/x-m4a"
                required
              />
              <Button className="mt-5 w-full" disabled={upload.isPending}>
                {upload.isPending ? 'Enviando…' : 'Enviar arquivo'}
              </Button>
            </form>
            <div className="space-y-2">
              {documents.data?.map((item) => (
                <article
                  key={item.id}
                  className="panel flex items-center justify-between gap-4 rounded-2xl p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.displayName}</p>
                    <p className="muted text-xs">{item.mimeType}</p>
                  </div>
                  <Button
                    variant="danger"
                    className="min-h-9 px-3 py-1 text-xs"
                    onClick={() => removeDocument.mutate(item.id)}
                  >
                    Excluir
                  </Button>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </DashboardShell>
  );
};

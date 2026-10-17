import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fixture from '../../../../packages/contracts/test/fixtures/helena-j2000.json';
import { HelenaDraftPanel } from '../components/helena/HelenaDraftPanel';
import * as service from '../services/helena-drafts';

vi.mock('../services/helena-drafts', () => ({
  searchHelenaClients: vi.fn(),
  createHelenaDraft: vi.fn(),
  updateHelenaDraft: vi.fn(),
  previewHelenaReport: vi.fn(),
  publishHelenaReport: vi.fn(),
  getHelenaDraft: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const saved = {
  id: '90000000-0000-4000-8000-000000000001',
  clientId: '10000000-0000-4000-8000-000000000001',
  subjectName: 'Mapa sintético',
  title: 'Mapa natal',
  analysis: 'Análise',
  revision: 1,
  result: fixture,
  report: null,
  createdAt: '2026-01-01T12:00:00Z',
  updatedAt: '2026-01-01T12:00:00Z',
};
const setup = (existing = false) => {
  vi.mocked(service.searchHelenaClients).mockResolvedValue({
    items: [
      { id: saved.clientId, fullName: 'Cliente sintética', role: 'client', status: 'active' },
    ],
    total: 1,
  } as never);
  const onSaved = vi.fn();
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <HelenaDraftPanel
        chart={fixture as never}
        name={saved.subjectName}
        saved={existing ? (saved as never) : null}
        creationId={saved.id}
        onSaved={onSaved}
        onBusy={() => {}}
        onDirty={() => {}}
      />
    </QueryClientProvider>,
  );
  return onSaved;
};
describe('HELENA saved reports', () => {
  it('saves metadata and natal input without trusting client-side positions', async () => {
    vi.mocked(service.createHelenaDraft).mockResolvedValue(saved as never);
    const onSaved = setup();
    await screen.findByRole('option', { name: 'Cliente sintética' }, { timeout: 10000 });
    fireEvent.change(screen.getByLabelText('Cliente destinatário'), {
      target: { value: saved.clientId },
    });
    fireEvent.change(screen.getByLabelText('Título do material'), {
      target: { value: saved.title },
    });
    fireEvent.change(screen.getByLabelText('Análise para o cliente'), {
      target: { value: saved.analysis },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar mapa' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved));
    expect(service.createHelenaDraft).toHaveBeenCalledWith({
      id: saved.id,
      clientId: saved.clientId,
      subjectName: saved.subjectName,
      title: saved.title,
      analysis: saved.analysis,
      natal: fixture.input,
    });
  });
  it('requires opening and acknowledging the PDF and invalidates review on editing', async () => {
    vi.mocked(service.previewHelenaReport).mockResolvedValue({
      reportId: saved.id,
      revision: 1,
      url: 'https://storage.test/review',
      expiresIn: 300,
    });
    setup(true);
    fireEvent.click(screen.getByRole('button', { name: 'Gerar PDF para revisão' }));
    const link = await screen.findByRole('link', { name: 'Abrir PDF para revisão' });
    expect(screen.getByRole('checkbox')).toBeDisabled();
    fireEvent.click(link);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: 'Liberar para o cliente' })).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Análise para o cliente'), {
      target: { value: 'Alteração ainda não salva' },
    });
    expect(screen.queryByRole('link', { name: 'Abrir PDF para revisão' })).not.toBeInTheDocument();
    expect(service.publishHelenaReport).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Gerar PDF para revisão' })).toBeDisabled();
  });
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fixture from '../../../../packages/contracts/test/fixtures/helena-j2000.json';
import { HelenaPage } from '../pages/HelenaPage';
import { calculateNatal } from '../services/helena';

vi.mock('../services/helena', () => ({ calculateNatal: vi.fn() }));
vi.mock('../components/helena/HelenaDraftPanel', () => ({ HelenaDraftPanel: () => null }));
vi.mock('../components/helena/HelenaLibrary', () => ({ HelenaLibrary: () => null }));
vi.mock('../components/DashboardShell', () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

const setup = () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <HelenaPage />
    </QueryClientProvider>,
  );
  for (const [label, value] of [
    ['Nome do mapa', 'Mapa sintético'],
    ['Data de nascimento', '2000-01-01'],
    ['Hora local de nascimento', '12:00:00'],
    ['Deslocamento UTC (minutos)', '0'],
    ['Latitude', '-23.5505'],
    ['Longitude', '-46.6333'],
  ] as const)
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
};

describe('HELENA administrative screen', () => {
  it('calculates and presents an accessible chart and numerical tables', async () => {
    vi.mocked(calculateNatal).mockResolvedValue(fixture as never);
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Calcular mapa natal' }));
    expect(
      await screen.findByRole('heading', { name: 'Posições planetárias' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /mandala natal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar JSON' })).toBeEnabled();
    expect(screen.getByRole('heading', { name: 'HELENA' })).toBeInTheDocument();
    expect(screen.queryByText(/pegasus/i)).not.toBeInTheDocument();
  });

  it('clears old results when inputs change', async () => {
    vi.mocked(calculateNatal).mockResolvedValue(fixture as never);
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Calcular mapa natal' }));
    await screen.findByRole('heading', { name: 'Posições planetárias' });
    fireEvent.change(screen.getByLabelText('Data de nascimento'), {
      target: { value: '2000-01-02' },
    });
    expect(screen.queryByRole('heading', { name: 'Posições planetárias' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Exportar JSON' })).not.toBeInTheDocument();
  });

  it('ignores a late calculation after the data is edited', async () => {
    let resolve: (value: never) => void = () => {};
    vi.mocked(calculateNatal).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Calcular mapa natal' }));
    await waitFor(() => expect(calculateNatal).toHaveBeenCalledOnce());
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '10' } });
    resolve(fixture as never);
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Posições planetárias' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('shows a service error and allows retry', async () => {
    vi.mocked(calculateNatal)
      .mockRejectedValueOnce(new Error('Motor indisponível'))
      .mockResolvedValue(fixture as never);
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Calcular mapa natal' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Motor indisponível');
    fireEvent.click(screen.getByRole('button', { name: 'Calcular mapa natal' }));
    expect(
      await screen.findByRole('heading', { name: 'Posições planetárias' }),
    ).toBeInTheDocument();
  });
});

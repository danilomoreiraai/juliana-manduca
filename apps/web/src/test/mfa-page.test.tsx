import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { listMfaFactors, enrollMfa, verifyMfa } = vi.hoisted(() => ({
  listMfaFactors: vi.fn(),
  enrollMfa: vi.fn(),
  verifyMfa: vi.fn(),
}));

vi.mock('../services/auth', () => ({ listMfaFactors, enrollMfa, verifyMfa }));

import { MfaPage } from '../pages/MfaPage';

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/mfa']}>
      <Routes>
        <Route path="/mfa" element={<MfaPage />} />
        <Route path="/admin" element={<p>Área administrativa</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe('admin MFA page', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it('offers a retry after setup fails and waits for a usable factor', async () => {
    listMfaFactors.mockResolvedValue([]);
    enrollMfa.mockRejectedValueOnce(new Error('Falha temporária')).mockResolvedValueOnce({
      id: 'new-factor',
      totp: { qr_code: 'data:image/svg+xml,qr', secret: 'TEST-SECRET' },
    });
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha temporária');
    expect(screen.getByRole('button', { name: 'Verificar e continuar' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByAltText('QR code para configurar autenticação')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(enrollMfa).toHaveBeenCalledTimes(2);
  });

  it('uses a verified factor and enters admin only after successful verification', async () => {
    listMfaFactors.mockResolvedValue([{ id: 'verified-factor', status: 'verified' }]);
    verifyMfa.mockResolvedValue(undefined);
    renderPage();

    const input = await screen.findByLabelText('Código de 6 dígitos');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Verificar e continuar' })).toBeDisabled(),
    );
    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verificar e continuar' }));

    expect(await screen.findByText('Área administrativa')).toBeInTheDocument();
    expect(enrollMfa).not.toHaveBeenCalled();
    expect(verifyMfa).toHaveBeenCalledWith('verified-factor', '123456');
  });
});

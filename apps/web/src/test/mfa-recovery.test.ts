import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listFactors, unenroll, enroll } = vi.hoisted(() => ({
  listFactors: vi.fn(),
  unenroll: vi.fn(),
  enroll: vi.fn(),
}));

vi.mock('../config', () => ({ config: { demoMode: false } }));
vi.mock('../lib/supabase', () => ({
  supabase: { auth: { mfa: { listFactors, unenroll, enroll } } },
}));
vi.mock('../observability', () => ({ recordApiFailure: vi.fn() }));

import { enrollMfa, listMfaFactors } from '../services/auth';

describe('admin MFA enrollment recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    unenroll.mockResolvedValue({ error: null });
    enroll.mockResolvedValue({
      data: { id: 'new-factor', totp: { qr_code: 'data:image/svg+xml,qr', secret: 'TEST-SECRET' } },
      error: null,
    });
  });

  it('removes only an abandoned portal factor before creating a new one', async () => {
    const pendingPortal = {
      id: 'pending-portal',
      factor_type: 'totp',
      status: 'unverified',
      friendly_name: 'Juliana Manduca Admin',
    };
    const pendingOther = {
      id: 'pending-other',
      factor_type: 'totp',
      status: 'unverified',
      friendly_name: 'Outro aplicativo',
    };
    listFactors.mockResolvedValue({
      data: { all: [pendingPortal, pendingOther], totp: [] },
      error: null,
    });

    await expect(enrollMfa()).resolves.toMatchObject({ id: 'new-factor' });
    expect(unenroll).toHaveBeenCalledExactlyOnceWith({ factorId: 'pending-portal' });
    expect(enroll).toHaveBeenCalledExactlyOnceWith({
      factorType: 'totp',
      friendlyName: 'Juliana Manduca Admin',
    });
  });

  it('keeps a verified factor available for the normal challenge', async () => {
    listFactors.mockResolvedValue({
      data: {
        all: [{ id: 'verified', factor_type: 'totp', status: 'verified' }],
        totp: [{ id: 'verified', factor_type: 'totp', status: 'verified' }],
      },
      error: null,
    });

    await expect(listMfaFactors()).resolves.toMatchObject([{ id: 'verified' }]);
    expect(unenroll).not.toHaveBeenCalled();
    expect(enroll).not.toHaveBeenCalled();
  });

  it('does not create a new factor when cleaning the abandoned one fails', async () => {
    listFactors.mockResolvedValue({
      data: {
        all: [
          {
            id: 'pending-portal',
            factor_type: 'totp',
            status: 'unverified',
            friendly_name: 'Juliana Manduca Admin',
          },
        ],
        totp: [],
      },
      error: null,
    });
    unenroll.mockResolvedValue({ error: new Error('Falha ao remover') });

    await expect(enrollMfa()).rejects.toThrow('Falha ao remover');
    expect(enroll).not.toHaveBeenCalled();
  });
});

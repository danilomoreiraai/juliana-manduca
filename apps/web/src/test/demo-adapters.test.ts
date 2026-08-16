import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createDemoConsultation: vi.fn(() => ({ id: 'consultation' })),
  deleteDemoConsultation: vi.fn(),
  deleteDemoDocument: vi.fn(),
  getDemoAssuranceLevel: vi.fn(() => 'aal1' as const),
  getDemoConsultations: vi.fn(() => [{ id: 'consultation' }]),
  getDemoDocuments: vi.fn(() => [{ id: 'document' }]),
  getDemoProfile: vi.fn(() => ({ id: 'profile' })),
  getDemoUsers: vi.fn(() => ({ items: [], total: 0 })),
  inviteDemoUser: vi.fn(() => ({ id: 'invited' })),
  setDemoUserStatus: vi.fn(() => ({ id: 'profile', status: 'active' })),
  signInDemo: vi.fn(() => ({ access_token: 'demo' })),
  signOutDemo: vi.fn(),
  updateDemoConsultation: vi.fn(() => ({ id: 'consultation', status: 'completed' })),
  updateDemoProfile: vi.fn(() => ({ id: 'profile', fullName: 'Nome' })),
  uploadDemoDocument: vi.fn(() => ({ id: 'document' })),
  verifyDemoMfa: vi.fn(),
}));

vi.mock('../config', () => ({
  config: {
    demoMode: true,
    demoMfaCode: '123456',
    whatsappNumber: undefined,
  },
}));
vi.mock('../services/demo', () => mocks);
vi.mock('../lib/supabase', () => ({ supabase: {} }));
vi.mock('../observability', () => ({ recordApiFailure: vi.fn() }));
vi.mock('../services/api', () => ({ apiRequest: vi.fn() }));

import {
  enrollMfa,
  getAssuranceLevel,
  listMfaFactors,
  sendPasswordReset,
  signIn,
  signOut,
  updatePassword,
  verifyMfa,
} from '../services/auth';
import {
  createAdminConsultation,
  deleteAdminConsultation,
  deleteAdminDocument,
  getAdminConsultations,
  getAdminDocuments,
  getAdminUsers,
  getConsultations,
  getDocuments,
  getProfile,
  inviteAdminUser,
  requestDocumentDownload,
  setAdminUserStatus,
  updateAdminConsultation,
  updateProfile,
  uploadAdminDocument,
} from '../services/portal';

describe('demo service adapters', () => {
  beforeEach(() => vi.clearAllMocks());

  it('routes every authentication operation to the local demo service', async () => {
    await expect(signIn({ email: 'teste@teste.com', password: '1q2w3e4r' })).resolves.toEqual({
      access_token: 'demo',
    });
    await signOut();
    await sendPasswordReset('teste@teste.com');
    await updatePassword('nova-senha');
    await expect(getAssuranceLevel()).resolves.toEqual({
      currentLevel: 'aal1',
      nextLevel: 'aal1',
    });
    await expect(listMfaFactors()).resolves.toEqual([{ id: 'demo-factor', status: 'verified' }]);
    await expect(enrollMfa()).resolves.toMatchObject({ id: 'demo-factor' });
    await verifyMfa('demo-factor', '123456');

    expect(mocks.signInDemo).toHaveBeenCalledOnce();
    expect(mocks.signOutDemo).toHaveBeenCalledOnce();
    expect(mocks.verifyDemoMfa).toHaveBeenCalledWith('123456');
  });

  it('routes client and admin portal operations to the in-memory demo', async () => {
    await getProfile();
    await updateProfile({ fullName: 'Nome' });
    await getConsultations();
    await getDocuments();
    await expect(requestDocumentDownload('document')).resolves.toEqual({
      url: '/assets/celestial-atlas.webp',
      expiresIn: 300,
    });
    await getAdminUsers('cliente');
    await inviteAdminUser({ email: 'nova@teste.com', fullName: 'Nova Cliente' });
    await setAdminUserStatus('profile', { status: 'active' });
    await getAdminConsultations();
    await createAdminConsultation({
      userId: '10000000-0000-4000-8000-000000000001',
      title: 'Consulta',
      scheduledAt: '2026-10-10T14:00:00.000Z',
      status: 'scheduled',
    });
    await updateAdminConsultation('consultation', { status: 'completed' });
    await deleteAdminConsultation('consultation');
    await getAdminDocuments('profile');
    await uploadAdminDocument({
      userId: 'profile',
      displayName: 'arquivo.pdf',
      file: new File(['demo'], 'arquivo.pdf', { type: 'application/pdf' }),
    });
    await deleteAdminDocument('document');

    expect(mocks.getDemoProfile).toHaveBeenCalledOnce();
    expect(mocks.getDemoConsultations).toHaveBeenCalledTimes(2);
    expect(mocks.getDemoDocuments).toHaveBeenCalledWith('profile');
    expect(mocks.uploadDemoDocument).toHaveBeenCalledOnce();
    expect(mocks.deleteDemoDocument).toHaveBeenCalledWith('document');
  });
});

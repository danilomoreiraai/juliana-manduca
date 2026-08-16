import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const configureDemo = () => {
  vi.stubEnv('VITE_DEMO_MODE', 'true');
  vi.stubEnv('VITE_DEMO_ADMIN_EMAIL', 'teste@teste.com');
  vi.stubEnv('VITE_DEMO_CLIENT_EMAIL', 'usuario@teste.com');
  vi.stubEnv('VITE_DEMO_PASSWORD', '1q2w3e4r');
  vi.stubEnv('VITE_DEMO_MFA_CODE', '123456');
};

describe('local demo services', () => {
  beforeEach(() => {
    localStorage.clear();
    configureDemo();
    vi.resetModules();
  });

  afterEach(() => vi.unstubAllEnvs());

  it('authenticates the client and isolates its seeded portal data', async () => {
    const demo = await import('../services/demo');

    const session = demo.signInDemo({ email: 'usuario@teste.com', password: '1q2w3e4r' });

    expect(session?.user.email).toBe('usuario@teste.com');
    expect(demo.getDemoProfile()).toMatchObject({ role: 'client', status: 'active' });
    expect(demo.getDemoConsultations()).toHaveLength(2);
    expect(demo.getDemoDocuments()).toHaveLength(1);
  });

  it('keeps an admin at aal1 until the local MFA code is verified', async () => {
    const demo = await import('../services/demo');
    demo.signInDemo({ email: 'teste@teste.com', password: '1q2w3e4r' });

    expect(demo.getDemoAssuranceLevel()).toBe('aal1');
    expect(() => demo.verifyDemoMfa('000000')).toThrow('Código de demonstração inválido');
    demo.verifyDemoMfa('123456');
    expect(demo.getDemoAssuranceLevel()).toBe('aal2');
  });

  it('supports the administrative demo operations without a backend', async () => {
    const demo = await import('../services/demo');
    demo.signInDemo({ email: 'teste@teste.com', password: '1q2w3e4r' });

    expect(demo.getDemoUsers('cliente').items).toHaveLength(1);
    expect(demo.getDemoConsultations()).toHaveLength(2);
    expect(demo.getDemoDocuments()).toHaveLength(1);

    const invited = demo.inviteDemoUser({
      email: 'nova@teste.com',
      fullName: 'Nova Cliente',
    });
    expect(invited.status).toBe('invited');
    expect(demo.setDemoUserStatus(invited.id, { status: 'active' }).status).toBe('active');

    const consultation = demo.createDemoConsultation({
      userId: invited.id,
      title: 'Consulta de validação',
      scheduledAt: '2026-10-10T14:00:00.000Z',
      status: 'scheduled',
      summary: null,
    });
    expect(demo.updateDemoConsultation(consultation.id, { status: 'completed' }).status).toBe(
      'completed',
    );
    demo.deleteDemoConsultation(consultation.id);
    expect(demo.getDemoConsultations()).not.toContainEqual(
      expect.objectContaining({ id: consultation.id }),
    );

    const document = demo.uploadDemoDocument({
      userId: invited.id,
      displayName: 'arquivo-demo.pdf',
      file: new File(['demo'], 'arquivo-demo.pdf', { type: 'application/pdf' }),
    });
    expect(demo.getDemoDocuments(invited.id)).toContainEqual(document);
    demo.deleteDemoDocument(document.id);
    expect(demo.getDemoDocuments(invited.id)).toEqual([]);
  });

  it('updates the signed-in profile and clears the local session on sign out', async () => {
    const demo = await import('../services/demo');
    demo.signInDemo({ email: 'usuario@teste.com', password: '1q2w3e4r' });

    expect(demo.updateDemoProfile({ fullName: 'Cliente Atualizada' }).fullName).toBe(
      'Cliente Atualizada',
    );
    demo.signOutDemo();
    expect(demo.readDemoSession()).toBeNull();
  });

  it('rejects credentials outside the two configured demo accounts', async () => {
    const demo = await import('../services/demo');

    expect(() => demo.signInDemo({ email: 'intruso@teste.com', password: '1q2w3e4r' })).toThrow(
      'E-mail ou senha de demonstração inválidos',
    );
    expect(demo.readDemoSession()).toBeNull();
  });
});

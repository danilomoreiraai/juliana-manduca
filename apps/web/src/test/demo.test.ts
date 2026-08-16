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

  it('rejects credentials outside the two configured demo accounts', async () => {
    const demo = await import('../services/demo');

    expect(() => demo.signInDemo({ email: 'intruso@teste.com', password: '1q2w3e4r' })).toThrow(
      'E-mail ou senha de demonstração inválidos',
    );
    expect(demo.readDemoSession()).toBeNull();
  });
});

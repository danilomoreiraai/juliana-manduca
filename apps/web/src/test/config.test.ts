import { afterEach, describe, expect, it, vi } from 'vitest';

const requiredEnv = {
  VITE_API_URL: 'https://api.example.com',
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
};

const loadConfig = async (instagramUrl: string) => {
  vi.resetModules();
  Object.entries(requiredEnv).forEach(([name, value]) => vi.stubEnv(name, value));
  vi.stubEnv('VITE_INSTAGRAM_URL', instagramUrl);
  return (await import('../config')).config;
};

describe('config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the default Instagram URL when the environment value is empty', async () => {
    const config = await loadConfig('');

    expect(config.instagramUrl).toBe('https://instagram.com/juliana.manduca');
  });

  it('uses a configured Instagram URL', async () => {
    const config = await loadConfig('https://instagram.com/custom-profile');

    expect(config.instagramUrl).toBe('https://instagram.com/custom-profile');
  });
});

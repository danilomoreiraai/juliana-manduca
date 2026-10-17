import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { helenaNatalInputSchema } from '@juliana/contracts';
import { expect, it } from 'vitest';
import fixture from '../../../packages/contracts/test/fixtures/helena-j2000.json' with { type: 'json' };
import { parseEnv } from '../src/env.js';
import { calculateHelenaNatal } from '../src/functions/helena.js';

it.skipIf(!process.env.HELENA_TEST_PYTHON)(
  'calculates through the live Python HTTP engine',
  async () => {
    const token = 'synthetic-live-bridge-secret-000000000';
    const child = spawn(
      process.env.HELENA_TEST_PYTHON!,
      [
        '-u',
        '-c',
        "import os; from server import create_server; s=create_server(os.environ['HELENA_ENGINE_TOKEN'], ('127.0.0.1', 0)); print(s.server_port, flush=True); s.serve_forever()",
      ],
      {
        cwd: fileURLToPath(new URL('../../../services/astrology/', import.meta.url)),
        env: { ...process.env, HELENA_ENGINE_TOKEN: token },
        stdio: ['ignore', 'pipe', 'ignore'],
        windowsHide: true,
      },
    );
    const lines = createInterface({ input: child.stdout! });
    const exited = once(child, 'exit');
    try {
      const [line] = await once(lines, 'line', { signal: AbortSignal.timeout(10000) });
      const port = Number(line);
      expect(port).toBeGreaterThan(0);
      const env = parseEnv({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://synthetic:synthetic@localhost/test',
        WEB_URL: 'http://localhost:5173',
        CORS_ORIGINS: 'http://localhost:5173',
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_PUBLISHABLE_KEY: 'synthetic',
        SUPABASE_SECRET_KEY: 'synthetic',
        HELENA_ENGINE_URL: `http://127.0.0.1:${port}`,
        HELENA_ENGINE_TOKEN: token,
      });
      const result = await calculateHelenaNatal(
        { env, db: {} as never, supabase: {} as never },
        helenaNatalInputSchema.parse(fixture.input),
      );
      expect(result.julianDayUt).toBe(2451545);
      expect(result.bodies[0]?.longitude).toBeCloseTo(280.3689, 3);
      expect(result).toEqual(fixture);
    } finally {
      lines.close();
      child.kill();
      await exited;
    }
  },
  15000,
);

import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().default('0.0.0.0'),
    PORT: z.coerce.number().int().positive().default(3333),
    DATABASE_URL: z.string().min(1),
    WEB_URL: z.url(),
    CORS_ORIGINS: z.string().min(1),
    SUPABASE_URL: z.url(),
    SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    SUPABASE_SECRET_KEY: z.string().min(1),
    SUPABASE_STORAGE_BUCKET: z.string().default('consultation-files'),
    HELENA_ENGINE_URL: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z
        .url()
        .refine((value) => {
          const url = new URL(value);
          return (
            ['http:', 'https:'].includes(url.protocol) &&
            !url.username &&
            !url.password &&
            !url.search &&
            !url.hash
          );
        }, 'URL interna da HELENA inválida')
        .optional(),
    ),
    HELENA_ENGINE_TOKEN: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z
        .string()
        .min(32)
        .regex(/^[\x21-\x7e]+$/)
        .optional(),
    ),
    SENTRY_DSN: z.string().optional(),
    SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
    RELEASE_SHA: z.string().optional(),
    OTEL_SERVICE_NAME: z.string().default('juliana-manduca-api'),
    OTEL_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.url().optional(),
    OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: z.url().optional(),
  })
  .superRefine((value, context) => {
    if (Boolean(value.HELENA_ENGINE_URL) !== Boolean(value.HELENA_ENGINE_TOKEN)) {
      context.addIssue({
        code: 'custom',
        path: ['HELENA_ENGINE_URL'],
        message: 'Configure URL e segredo da HELENA juntos',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export const parseEnv = (source: NodeJS.ProcessEnv = process.env): Env => envSchema.parse(source);

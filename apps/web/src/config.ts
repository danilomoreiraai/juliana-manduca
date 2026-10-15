import { z } from 'zod';

const configSchema = z
  .object({
    apiUrl: z.url(),
    supabaseUrl: z.url(),
    supabasePublishableKey: z.string().min(1),
    sentryDsn: z.string().optional(),
    sentryTracesSampleRate: z.coerce.number().min(0).max(1).default(0.1),
    releaseSha: z.string().optional(),
    whatsappNumber: z
      .string()
      .regex(/^\d{10,15}$/)
      .optional(),
    instagramUrl: z.url().default('https://instagram.com/juliana.manduca'),
    demoMode: z.boolean(),
    demoAdminEmail: z.email().optional(),
    demoClientEmail: z.email().optional(),
    demoPassword: z.string().min(8).optional(),
    demoMfaCode: z
      .string()
      .regex(/^\d{6}$/)
      .default('123456'),
  })
  .superRefine((value, context) => {
    if (!value.demoMode) return;
    for (const field of ['demoAdminEmail', 'demoClientEmail', 'demoPassword'] as const) {
      if (!value[field])
        context.addIssue({ code: 'custom', path: [field], message: 'Obrigatório no modo demo' });
    }
  });

export const config = configSchema.parse({
  apiUrl:
    import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3333' : undefined),
  supabaseUrl:
    import.meta.env.VITE_SUPABASE_URL ||
    (import.meta.env.DEV ? 'http://127.0.0.1:54321' : undefined),
  supabasePublishableKey:
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (import.meta.env.DEV ? 'local-publishable-key' : undefined),
  sentryDsn: import.meta.env.VITE_SENTRY_DSN || undefined,
  sentryTracesSampleRate: import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || undefined,
  releaseSha: import.meta.env.VITE_RELEASE_SHA || undefined,
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || undefined,
  instagramUrl: import.meta.env.VITE_INSTAGRAM_URL || undefined,
  demoMode: import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true',
  demoAdminEmail: import.meta.env.DEV
    ? import.meta.env.VITE_DEMO_ADMIN_EMAIL || undefined
    : undefined,
  demoClientEmail: import.meta.env.DEV
    ? import.meta.env.VITE_DEMO_CLIENT_EMAIL || undefined
    : undefined,
  demoPassword: import.meta.env.DEV ? import.meta.env.VITE_DEMO_PASSWORD || undefined : undefined,
  demoMfaCode: import.meta.env.DEV ? import.meta.env.VITE_DEMO_MFA_CODE || undefined : undefined,
});

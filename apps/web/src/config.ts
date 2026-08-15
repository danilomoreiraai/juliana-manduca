import { z } from 'zod';

const configSchema = z.object({
  apiUrl: z.url(),
  supabaseUrl: z.url(),
  supabasePublishableKey: z.string().min(1),
  sentryDsn: z.string().optional(),
  sentryRelease: z.string().optional(),
  whatsappNumber: z
    .string()
    .regex(/^\d{10,15}$/)
    .optional(),
  instagramUrl: z.url().default('https://instagram.com/juliana.manduca'),
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
  sentryRelease: import.meta.env.VITE_SENTRY_RELEASE || undefined,
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || undefined,
  instagramUrl: import.meta.env.VITE_INSTAGRAM_URL,
});

import { config } from './config';

type WebEvent = {
  breadcrumbs?: Array<{ data?: Record<string, unknown> }>;
  request?: {
    cookies?: unknown;
    data?: unknown;
    headers?: Record<string, string>;
    query_string?: unknown;
    url?: string;
  };
  user?: unknown;
};

const stripQuery = (value: string) =>
  (value.split(/[?#]/, 1)[0] ?? value).replace(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
    ':id',
  );

const sanitizeWebEvent = <T extends WebEvent>(event: T): T => {
  delete event.user;
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.query_string;
    if (event.request.url) event.request.url = stripQuery(event.request.url);
    if (event.request.headers) {
      event.request.headers = Object.fromEntries(
        Object.entries(event.request.headers).filter(
          ([name]) => !['authorization', 'cookie', 'set-cookie'].includes(name.toLowerCase()),
        ),
      );
    }
  }
  for (const breadcrumb of event.breadcrumbs ?? []) {
    const url = breadcrumb.data?.url;
    if (typeof url === 'string') breadcrumb.data!.url = stripQuery(url);
    if (breadcrumb.data) {
      delete breadcrumb.data.body;
      delete breadcrumb.data.email;
      delete breadcrumb.data.token;
    }
  }
  return event;
};

export const startWebObservability = async () => {
  if (!config.sentryDsn) return;
  const Sentry = await import('@sentry/react');
  Sentry.init({
    beforeSend: sanitizeWebEvent,
    dsn: config.sentryDsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    release: config.releaseSha,
    sendDefaultPii: false,
    tracePropagationTargets: [config.apiUrl],
    tracesSampleRate: config.sentryTracesSampleRate,
  });
};

export const recordApiFailure = async (input: {
  kind: 'api' | 'authentication' | 'upload';
  path: string;
  requestId?: string;
  statusCode?: number;
}) => {
  if (!config.sentryDsn) return;
  const Sentry = await import('@sentry/react');
  const attributes = {
    kind: input.kind,
    route: stripQuery(input.path),
    status_code: input.statusCode ?? 0,
  };
  Sentry.metrics.count('app.failure', 1, { attributes });
  if ((input.statusCode ?? 0) >= 500) {
    Sentry.captureMessage('API request failed', {
      level: 'error',
      tags: {
        ...attributes,
        ...(input.requestId ? { request_id: input.requestId } : {}),
      },
    });
  }
};

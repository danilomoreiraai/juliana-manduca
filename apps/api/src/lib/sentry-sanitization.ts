type SanitizableEvent = {
  breadcrumbs?: Array<{
    data?: Record<string, unknown>;
    message?: string;
  }>;
  exception?: { values?: Array<{ value?: string }> };
  message?: string;
  request?: {
    cookies?: unknown;
    data?: unknown;
    headers?: Record<string, string>;
    query_string?: unknown;
    url?: string;
  };
  user?: unknown;
};

const redactText = (value: string) =>
  value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED_TOKEN]');

const sensitiveHeaderNames = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-supabase-api-key',
]);

export const stripUrlQuery = (value: string) => {
  try {
    const url = new URL(value, 'https://redacted.invalid');
    url.search = '';
    url.hash = '';
    const normalizedPath = url.pathname.replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
      ':id',
    );
    if (!value.startsWith('http')) return normalizedPath;
    url.pathname = normalizedPath;
    return url.toString();
  } catch {
    return value.split(/[?#]/, 1)[0] ?? value;
  }
};

const sanitizeHeaders = (headers: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(headers).filter(([name]) => !sensitiveHeaderNames.has(name.toLowerCase())),
  );

export const sanitizeSentryEvent = <T extends SanitizableEvent>(event: T): T => {
  delete event.user;
  if (event.message) event.message = redactText(event.message);
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = redactText(exception.value);
  }

  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.query_string;
    if (event.request.url) event.request.url = stripUrlQuery(event.request.url);
    if (event.request.headers) event.request.headers = sanitizeHeaders(event.request.headers);
  }

  for (const breadcrumb of event.breadcrumbs ?? []) {
    if (breadcrumb.message) breadcrumb.message = redactText(breadcrumb.message);
    const url = breadcrumb.data?.url;
    if (typeof url === 'string') breadcrumb.data!.url = stripUrlQuery(url);
    if (breadcrumb.data) {
      delete breadcrumb.data.body;
      delete breadcrumb.data.email;
      delete breadcrumb.data.token;
    }
  }

  return event;
};

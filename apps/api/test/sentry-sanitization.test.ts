import { describe, expect, it } from 'vitest';
import { sanitizeSentryEvent, stripUrlQuery } from '../src/lib/sentry-sanitization.js';

describe('Sentry sanitization', () => {
  it('removes personal data, secrets and query strings', () => {
    const event = sanitizeSentryEvent({
      user: { id: 'person-id', email: 'person@example.com' },
      message: 'Failure for person@example.com using Bearer top-secret',
      exception: { values: [{ value: 'JWT eyJabc.def.ghi rejected' }] },
      request: {
        url: 'https://api.example.com/admin/documents?userId=person-id',
        query_string: 'userId=person-id',
        data: { password: 'secret' },
        cookies: 'session=secret',
        headers: {
          authorization: 'Bearer secret',
          cookie: 'session=secret',
          accept: 'application/json',
        },
      },
      breadcrumbs: [{ data: { url: '/users?email=person@example.com', token: 'secret' } }],
    });

    expect(event.user).toBeUndefined();
    expect(event.message).toBe('Failure for [REDACTED_EMAIL] using Bearer [REDACTED]');
    expect(event.exception?.values?.[0]?.value).toBe('JWT [REDACTED_TOKEN] rejected');
    expect(event.request).toEqual({
      url: 'https://api.example.com/admin/documents',
      headers: { accept: 'application/json' },
    });
    expect(event.breadcrumbs).toEqual([{ data: { url: '/users' } }]);
  });

  it('sanitizes relative and malformed URLs without throwing', () => {
    expect(stripUrlQuery('/documents?token=secret')).toBe('/documents');
    expect(stripUrlQuery('not a url?secret=yes')).toBe('/not%20a%20url');
  });
});

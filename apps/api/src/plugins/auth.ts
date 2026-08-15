import { eq } from 'drizzle-orm';
import fp from 'fastify-plugin';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { profiles } from '../db/schema.js';
import { forbidden, unauthorized } from '../lib/errors.js';

export const authPlugin = fp(async (app) => {
  const issuer = `${app.services.env.SUPABASE_URL}/auth/v1`;
  const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

  app.decorateRequest('currentUser', null);

  app.decorate('authenticate', async (request) => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw unauthorized();

    const token = header.slice('Bearer '.length);
    let payload;
    try {
      ({ payload } = await jwtVerify(token, jwks, {
        issuer,
        audience: 'authenticated',
      }));
    } catch {
      throw unauthorized();
    }

    if (!payload.sub) throw unauthorized();
    const [profile] = await app.services.db
      .select()
      .from(profiles)
      .where(eq(profiles.id, payload.sub))
      .limit(1);

    if (!profile || profile.status === 'disabled') throw forbidden('Conta desativada');

    request.currentUser = {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
      status: profile.status,
      aal: payload.aal === 'aal2' ? 'aal2' : 'aal1',
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  });

  app.decorate('requireAdmin', async (request, reply) => {
    await app.authenticate(request, reply);
    if (request.currentUser?.role !== 'admin') throw forbidden();
    if (request.currentUser.aal !== 'aal2')
      throw forbidden('Autenticação de dois fatores obrigatória');
  });
});

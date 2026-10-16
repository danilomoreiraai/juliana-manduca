import { randomBytes, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

const projectRef = 'rxxriflonxesgvxokptk';
const apiUrl = 'https://live-projects-juliana-api.leapir.easypanel.host';
const bucket = 'consultation-files';
const pdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n');

const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

const expectStatus = async (response: Response, status: number, scenario: string) => {
  if (response.status !== status) {
    throw new Error(`${scenario}: expected HTTP ${status}, got ${response.status}`);
  }
  return response;
};

const main = async () => {
  if (process.env.RUN_REAL_ISOLATION !== 'true') {
    throw new Error('Set RUN_REAL_ISOLATION=true for the isolated validation project');
  }

  const supabaseUrl = required('SUPABASE_URL');
  if (new URL(supabaseUrl).hostname !== `${projectRef}.supabase.co`) {
    throw new Error('This script is restricted to the confirmed isolated Supabase project');
  }

  const databaseUrl = required('DATABASE_URL');
  const databaseAddress = new URL(databaseUrl);
  const supabaseHost =
    databaseAddress.hostname.endsWith('.supabase.com') ||
    databaseAddress.hostname.endsWith('.supabase.co');
  if (
    !supabaseHost ||
    !(
      databaseAddress.username.includes(projectRef) || databaseAddress.hostname.includes(projectRef)
    )
  ) {
    throw new Error('Database URL does not identify the isolated Supabase project');
  }
  const sql = postgres(databaseUrl, { max: 1 });
  const publicKey = required('SUPABASE_PUBLISHABLE_KEY');
  const admin = createClient(supabaseUrl, required('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const publicClient = () =>
    createClient(supabaseUrl, publicKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  const request = (path: string, token?: string, method = 'GET') =>
    fetch(`${apiUrl}${path}`, {
      method,
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });

  const runId = randomUUID();
  const documents: { id: string; path: string }[] = [];
  let clientBId: string | undefined;
  let failure: unknown;
  try {
    const clientA = publicClient();
    const adminClient = publicClient();
    const [{ data: a, error: aError }, { data: adminData, error: adminError }] = await Promise.all([
      clientA.auth.signInWithPassword({
        email: required('TEST_CLIENT_EMAIL'),
        password: required('TEST_CLIENT_PASSWORD'),
      }),
      adminClient.auth.signInWithPassword({
        email: required('TEST_ADMIN_EMAIL'),
        password: required('TEST_ADMIN_PASSWORD'),
      }),
    ]);
    if (aError || adminError || !a.session || !adminData.session) {
      throw new Error('Could not authenticate existing validation users');
    }
    const tokenA = a.session.access_token;
    const tokenAdmin = adminData.session.access_token;

    await expectStatus(await request('/health/ready'), 200, 'API readiness');
    await expectStatus(await request('/documents'), 401, 'anonymous documents');
    await expectStatus(await request('/admin/users'), 401, 'anonymous admin');
    await expectStatus(await request('/admin/users', tokenA), 403, 'client admin');
    const adminMe = await expectStatus(await request('/me', tokenAdmin), 200, 'admin profile');
    if ((await adminMe.json()).aal !== 'aal1') {
      throw new Error('Admin test requires a fresh AAL1 password session');
    }
    await expectStatus(await request('/admin/users', tokenAdmin), 403, 'admin AAL1');
    console.info('PASS anonymous, client and admin AAL1 authorization');

    const [privateBucket] = await sql<{ public: boolean }[]>`
      select public from storage.buckets where id = ${bucket}
    `;
    if (!privateBucket || privateBucket.public) throw new Error('Validation bucket is not private');
    console.info('PASS private Storage bucket configuration');

    const emailB = `issue31-${runId}@example.com`;
    const passwordB = randomBytes(32).toString('base64url');
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: emailB,
      password: passwordB,
      email_confirm: true,
    });
    if (createError || !created.user) throw new Error('Could not create synthetic client B');
    clientBId = created.user.id;
    await sql`
      insert into app.profiles (id, email, full_name, role, status)
      values (${clientBId}, ${emailB}, 'Cliente B Sintética', 'client', 'active')
    `;

    const clientB = publicClient();
    const { data: b, error: bError } = await clientB.auth.signInWithPassword({
      email: emailB,
      password: passwordB,
    });
    if (bError || !b.session) throw new Error('Could not authenticate synthetic client B');
    const tokenB = b.session.access_token;

    for (const userId of [a.user.id, clientBId]) {
      const id = randomUUID();
      const path = `${userId}/issue31-${runId}.pdf`;
      const { error } = await admin.storage.from(bucket).upload(path, pdf, {
        contentType: 'application/pdf',
        upsert: false,
      });
      if (error) throw new Error('Could not upload synthetic PDF fixture');
      documents.push({ id, path });
      await sql`
        insert into app.documents
          (id, user_id, storage_path, display_name, mime_type, size_bytes, created_by)
        values
          (${id}, ${userId}, ${path}, 'PDF sintético de validação',
           'application/pdf', ${pdf.length}, ${adminData.user.id})
      `;
    }

    const [documentA, documentB] = documents;
    if (!documentA || !documentB) throw new Error('Synthetic fixtures are incomplete');
    for (const [label, token, ownId, otherId] of [
      ['A', tokenA, documentA.id, documentB.id],
      ['B', tokenB, documentB.id, documentA.id],
    ] as const) {
      const listing = await expectStatus(
        await request('/documents', token),
        200,
        `client ${label} list`,
      );
      const items = (await listing.json()) as { id: string }[];
      if (!items.some((item) => item.id === ownId) || items.some((item) => item.id === otherId)) {
        throw new Error(`Client ${label} document list crossed tenant boundary`);
      }
      await expectStatus(
        await request(`/documents/${otherId}/download`, token, 'POST'),
        404,
        `client ${label} cross-download`,
      );
    }
    console.info('PASS client A/B document listing and cross-download denial');

    const anonymousObject = await fetch(
      `${supabaseUrl}/storage/v1/object/${bucket}/${documentB.path}`,
    );
    if (anonymousObject.ok) throw new Error('Anonymous Storage object access was allowed');
    const localSigned = await admin.storage.from(bucket).createSignedUrl(documentB.path, 300);
    if (localSigned.error || !localSigned.data.signedUrl) {
      throw new Error('Direct Supabase signed URL creation failed');
    }
    console.info('PASS direct Supabase signed URL creation');
    const ownDownload = await expectStatus(
      await request(`/documents/${documentB.id}/download`, tokenB, 'POST'),
      200,
      'client B own download',
    );
    const signed = (await ownDownload.json()) as { url?: string; expiresIn?: number };
    if (!signed.url || signed.expiresIn !== 300) {
      throw new Error('Signed download did not declare the configured 300-second lifetime');
    }
    if (new URL(signed.url).hostname !== `${projectRef}.supabase.co`) {
      throw new Error('Signed download points outside the isolated Supabase project');
    }
    const signedObject = await expectStatus(
      await fetch(signed.url),
      200,
      'signed Storage download',
    );
    if (!Buffer.from(await signedObject.arrayBuffer()).equals(pdf)) {
      throw new Error('Signed download content differs from the synthetic fixture');
    }
    console.info(
      'PASS anonymous Storage denial and signed download with 300-second declared lifetime',
    );

    await sql`update app.profiles set status = 'disabled' where id = ${clientBId}`;
    await expectStatus(await request('/me', tokenB), 403, 'disabled client profile');
    await expectStatus(await request('/documents', tokenB), 403, 'disabled client documents');
    console.info('PASS disabled client denial');
  } catch (error) {
    failure = error;
  }

  const cleanupErrors: string[] = [];
  for (const document of documents) {
    try {
      await sql`delete from app.documents where id = ${document.id}`;
      const { error } = await admin.storage.from(bucket).remove([document.path]);
      if (error) cleanupErrors.push('Storage fixture');
    } catch {
      cleanupErrors.push('document fixture');
    }
  }
  if (clientBId) {
    try {
      await sql`delete from app.profiles where id = ${clientBId}`;
      const { error } = await admin.auth.admin.deleteUser(clientBId);
      if (error) cleanupErrors.push('synthetic Auth user');
    } catch {
      cleanupErrors.push('synthetic client profile');
    }
  }
  try {
    await sql.end();
  } catch {
    cleanupErrors.push('database connection');
  }
  if (cleanupErrors.length) throw new Error(`Cleanup failed: ${cleanupErrors.join(', ')}`);
  console.info('CLEANUP synthetic users, documents and Storage objects complete');
  if (failure) throw failure;
  console.info('PASS isolated real-infrastructure checks complete');
};

main().catch((error: unknown) => {
  console.error(
    error instanceof Error && error.constructor === Error
      ? error.message
      : 'Unexpected validation failure; inspect local logs without sharing sensitive values',
  );
  process.exitCode = 1;
});

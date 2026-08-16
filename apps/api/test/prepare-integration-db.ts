import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const sql = postgres(databaseUrl, { max: 1 });

await sql.unsafe(`
  DO $$ BEGIN
    CREATE ROLE anon NOLOGIN;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE ROLE authenticated NOLOGIN;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;

  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE TABLE IF NOT EXISTS auth.users (
    id uuid PRIMARY KEY
  );

  CREATE SCHEMA IF NOT EXISTS storage;
  CREATE TABLE IF NOT EXISTS storage.buckets (
    id text PRIMARY KEY,
    name text NOT NULL,
    public boolean NOT NULL DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[]
  );
`);

await sql.end();

import {
  bigint,
  index,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const appSchema = pgSchema('app');

export const userRole = appSchema.enum('user_role', ['client', 'admin']);
export const profileStatus = appSchema.enum('profile_status', ['invited', 'active', 'disabled']);
export const consultationStatus = appSchema.enum('consultation_status', [
  'scheduled',
  'completed',
  'cancelled',
]);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

export const profiles = appSchema.table(
  'profiles',
  {
    id: uuid('id').primaryKey(),
    email: varchar('email', { length: 320 }).notNull().unique(),
    fullName: varchar('full_name', { length: 120 }).notNull(),
    role: userRole('role').notNull().default('client'),
    status: profileStatus('status').notNull().default('invited'),
    ...timestamps,
  },
  (table) => [
    index('profiles_status_idx').on(table.status),
    index('profiles_email_idx').on(table.email),
  ],
);

export const consultations = appSchema.table(
  'consultations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 160 }).notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    status: consultationStatus('status').notNull().default('scheduled'),
    summary: text('summary'),
    ...timestamps,
  },
  (table) => [
    index('consultations_user_date_idx').on(table.userId, table.scheduledAt),
    index('consultations_status_date_idx').on(table.status, table.scheduledAt),
  ],
);

export const documents = appSchema.table(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    consultationId: uuid('consultation_id').references(() => consultations.id, {
      onDelete: 'set null',
    }),
    storagePath: text('storage_path').notNull().unique(),
    displayName: varchar('display_name', { length: 180 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('documents_user_created_idx').on(table.userId, table.createdAt),
    index('documents_consultation_idx').on(table.consultationId),
  ],
);

export const auditEvents = appSchema.table(
  'audit_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id').notNull(),
    action: varchar('action', { length: 80 }).notNull(),
    entityType: varchar('entity_type', { length: 80 }).notNull(),
    entityId: uuid('entity_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('audit_events_actor_created_idx').on(table.actorId, table.createdAt)],
);

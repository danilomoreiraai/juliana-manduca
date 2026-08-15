CREATE SCHEMA "app";
--> statement-breakpoint
REVOKE ALL ON SCHEMA "app" FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE TYPE "app"."consultation_status" AS ENUM('scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "app"."profile_status" AS ENUM('invited', 'active', 'disabled');--> statement-breakpoint
CREATE TYPE "app"."user_role" AS ENUM('client', 'admin');--> statement-breakpoint
CREATE TABLE "app"."audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" varchar(80) NOT NULL,
	"entity_type" varchar(80) NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(160) NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" "app"."consultation_status" DEFAULT 'scheduled' NOT NULL,
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"consultation_id" uuid,
	"storage_path" text NOT NULL,
	"display_name" varchar(180) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" bigint NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documents_storage_path_unique" UNIQUE("storage_path")
);
--> statement-breakpoint
CREATE TABLE "app"."profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"full_name" varchar(120) NOT NULL,
	"role" "app"."user_role" DEFAULT 'client' NOT NULL,
	"status" "app"."profile_status" DEFAULT 'invited' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "app"."consultations" ADD CONSTRAINT "consultations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."profiles" ADD CONSTRAINT "profiles_id_auth_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."documents" ADD CONSTRAINT "documents_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."documents" ADD CONSTRAINT "documents_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "app"."consultations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."documents" ADD CONSTRAINT "documents_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "app"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."audit_events" ADD CONSTRAINT "audit_events_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "app"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_events_actor_created_idx" ON "app"."audit_events" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE INDEX "consultations_user_date_idx" ON "app"."consultations" USING btree ("user_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "consultations_status_date_idx" ON "app"."consultations" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX "documents_user_created_idx" ON "app"."documents" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "documents_consultation_idx" ON "app"."documents" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX "profiles_status_idx" ON "app"."profiles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "profiles_email_idx" ON "app"."profiles" USING btree ("email");
--> statement-breakpoint
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'consultation-files',
  'consultation-files',
  false,
  52428800,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a']
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

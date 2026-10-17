CREATE TABLE "app"."helena_drafts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"client_id" uuid NOT NULL,
	"subject_name" varchar(120) NOT NULL,
	"title" varchar(160) NOT NULL,
	"analysis" text NOT NULL,
	"result" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."helena_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draft_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"client_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"sha256" varchar(64) NOT NULL,
	"size_bytes" integer NOT NULL,
	"format_version" varchar(40) NOT NULL,
	"document_id" uuid,
	"published_by" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "helena_reports_storage_path_unique" UNIQUE("storage_path")
);
--> statement-breakpoint
ALTER TABLE "app"."helena_drafts" ADD CONSTRAINT "helena_drafts_client_id_profiles_id_fk" FOREIGN KEY ("client_id") REFERENCES "app"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."helena_reports" ADD CONSTRAINT "helena_reports_draft_id_helena_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "app"."helena_drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."helena_reports" ADD CONSTRAINT "helena_reports_client_id_profiles_id_fk" FOREIGN KEY ("client_id") REFERENCES "app"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."helena_reports" ADD CONSTRAINT "helena_reports_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "app"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "helena_drafts_updated_idx" ON "app"."helena_drafts" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "helena_drafts_client_idx" ON "app"."helena_drafts" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "helena_reports_draft_revision_idx" ON "app"."helena_reports" USING btree ("draft_id","revision");
--> statement-breakpoint
REVOKE ALL ON "app"."helena_drafts", "app"."helena_reports" FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE POLICY "helena_private_objects_api_only" ON "storage"."objects"
AS RESTRICTIVE FOR ALL TO anon, authenticated
USING (name NOT LIKE 'helena-private/%')
WITH CHECK (name NOT LIKE 'helena-private/%');

CREATE TABLE "admission_form_fields" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"scope" text DEFAULT 'application' NOT NULL,
	"field_type" text DEFAULT 'text' NOT NULL,
	"placeholder" text,
	"help_text" text,
	"required" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"options" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admission_applications" ADD COLUMN "custom_field_values" jsonb;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "custom_field_values" jsonb;--> statement-breakpoint
ALTER TABLE "admission_form_fields" ADD CONSTRAINT "admission_form_fields_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admission_form_fields_institution_idx" ON "admission_form_fields" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "admission_form_fields_scope_idx" ON "admission_form_fields" USING btree ("scope");--> statement-breakpoint
CREATE UNIQUE INDEX "admission_form_fields_key_unique_idx" ON "admission_form_fields" USING btree ("institution_id","key");
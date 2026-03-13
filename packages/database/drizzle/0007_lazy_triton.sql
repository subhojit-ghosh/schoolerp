CREATE TABLE "sections" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"class_id" text NOT NULL,
	"name" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"campus_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_campus_id_campus_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sections_institution_idx" ON "sections" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "sections_class_idx" ON "sections" USING btree ("class_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sections_name_per_class_unique_idx" ON "sections" USING btree ("class_id","name") WHERE "sections"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "classes_institution_idx" ON "classes" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "classes_campus_idx" ON "classes" USING btree ("campus_id");--> statement-breakpoint
CREATE UNIQUE INDEX "classes_name_per_campus_unique_idx" ON "classes" USING btree ("campus_id","name") WHERE "classes"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "classes_code_per_institution_unique_idx" ON "classes" USING btree ("institution_id","code") WHERE "classes"."deleted_at" IS NULL AND "classes"."code" IS NOT NULL;
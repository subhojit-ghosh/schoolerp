CREATE TABLE "homework" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"class_id" text NOT NULL,
	"section_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"created_by_member_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"attachment_instructions" text,
	"due_date" date NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_created_by_member_id_member_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "homework_institution_idx" ON "homework" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "homework_class_section_idx" ON "homework" USING btree ("institution_id","class_id","section_id");--> statement-breakpoint
CREATE INDEX "homework_subject_idx" ON "homework" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "homework_status_idx" ON "homework" USING btree ("status");--> statement-breakpoint
CREATE INDEX "homework_due_date_idx" ON "homework" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "homework_created_by_idx" ON "homework" USING btree ("created_by_member_id");
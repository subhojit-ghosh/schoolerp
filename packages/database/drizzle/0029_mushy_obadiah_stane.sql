CREATE TABLE "timetable_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"campus_id" text NOT NULL,
	"class_id" text NOT NULL,
	"section_id" text NOT NULL,
	"timetable_version_id" text NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"campus_id" text NOT NULL,
	"class_id" text NOT NULL,
	"section_id" text NOT NULL,
	"academic_year_id" text,
	"bell_schedule_id" text NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bell_schedules" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD COLUMN "timetable_version_id" text;--> statement-breakpoint
ALTER TABLE "timetable_assignments" ADD CONSTRAINT "timetable_assignments_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_assignments" ADD CONSTRAINT "timetable_assignments_campus_id_campus_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_assignments" ADD CONSTRAINT "timetable_assignments_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_assignments" ADD CONSTRAINT "timetable_assignments_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_assignments" ADD CONSTRAINT "timetable_assignments_timetable_version_id_timetable_versions_id_fk" FOREIGN KEY ("timetable_version_id") REFERENCES "public"."timetable_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_versions" ADD CONSTRAINT "timetable_versions_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_versions" ADD CONSTRAINT "timetable_versions_campus_id_campus_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_versions" ADD CONSTRAINT "timetable_versions_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_versions" ADD CONSTRAINT "timetable_versions_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_versions" ADD CONSTRAINT "timetable_versions_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_versions" ADD CONSTRAINT "timetable_versions_bell_schedule_id_bell_schedules_id_fk" FOREIGN KEY ("bell_schedule_id") REFERENCES "public"."bell_schedules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_versions" ADD CONSTRAINT "timetable_versions_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_versions" ADD CONSTRAINT "timetable_versions_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "timetable_assignments_institution_idx" ON "timetable_assignments" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "timetable_assignments_scope_idx" ON "timetable_assignments" USING btree ("campus_id","class_id","section_id");--> statement-breakpoint
CREATE INDEX "timetable_assignments_version_idx" ON "timetable_assignments" USING btree ("timetable_version_id");--> statement-breakpoint
CREATE INDEX "timetable_versions_institution_idx" ON "timetable_versions" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "timetable_versions_scope_idx" ON "timetable_versions" USING btree ("campus_id","class_id","section_id");--> statement-breakpoint
CREATE INDEX "timetable_versions_status_idx" ON "timetable_versions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "timetable_versions_name_per_scope_unique_idx" ON "timetable_versions" USING btree ("section_id","name") WHERE "timetable_versions"."status" != 'archived';--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_timetable_version_id_timetable_versions_id_fk" FOREIGN KEY ("timetable_version_id") REFERENCES "public"."timetable_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "timetable_entries_version_idx" ON "timetable_entries" USING btree ("timetable_version_id");
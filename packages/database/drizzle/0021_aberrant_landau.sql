CREATE TABLE "calendar_events" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"campus_id" text,
	"title" text NOT NULL,
	"description" text,
	"event_date" date NOT NULL,
	"start_time" text,
	"end_time" text,
	"is_all_day" boolean DEFAULT true NOT NULL,
	"event_type" text DEFAULT 'event' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"campus_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "timetable_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"campus_id" text NOT NULL,
	"class_id" text NOT NULL,
	"section_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"day_of_week" text NOT NULL,
	"period_index" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"room" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_campus_id_campus_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_campus_id_campus_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_campus_id_campus_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendar_events_institution_idx" ON "calendar_events" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "calendar_events_campus_idx" ON "calendar_events" USING btree ("campus_id");--> statement-breakpoint
CREATE INDEX "calendar_events_event_date_idx" ON "calendar_events" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "calendar_events_status_idx" ON "calendar_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subjects_institution_idx" ON "subjects" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "subjects_campus_idx" ON "subjects" USING btree ("campus_id");--> statement-breakpoint
CREATE INDEX "subjects_status_idx" ON "subjects" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "subjects_name_per_campus_unique_idx" ON "subjects" USING btree ("campus_id","name") WHERE "subjects"."status" != 'deleted';--> statement-breakpoint
CREATE INDEX "timetable_entries_institution_idx" ON "timetable_entries" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "timetable_entries_scope_idx" ON "timetable_entries" USING btree ("campus_id","class_id","section_id");--> statement-breakpoint
CREATE INDEX "timetable_entries_subject_idx" ON "timetable_entries" USING btree ("subject_id");--> statement-breakpoint
CREATE UNIQUE INDEX "timetable_entries_section_slot_unique_idx" ON "timetable_entries" USING btree ("section_id","day_of_week","period_index") WHERE "timetable_entries"."status" != 'deleted';
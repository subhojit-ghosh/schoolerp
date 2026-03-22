CREATE TABLE "bell_schedule_periods" (
	"id" text PRIMARY KEY NOT NULL,
	"bell_schedule_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"period_index" integer NOT NULL,
	"label" text,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_break" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bell_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"campus_id" text NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD COLUMN "bell_schedule_period_id" text;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD COLUMN "staff_id" text;--> statement-breakpoint
ALTER TABLE "bell_schedule_periods" ADD CONSTRAINT "bell_schedule_periods_bell_schedule_id_bell_schedules_id_fk" FOREIGN KEY ("bell_schedule_id") REFERENCES "public"."bell_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bell_schedule_periods" ADD CONSTRAINT "bell_schedule_periods_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bell_schedules" ADD CONSTRAINT "bell_schedules_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bell_schedules" ADD CONSTRAINT "bell_schedules_campus_id_campus_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bell_schedule_periods_schedule_idx" ON "bell_schedule_periods" USING btree ("bell_schedule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bell_schedule_periods_slot_unique_idx" ON "bell_schedule_periods" USING btree ("bell_schedule_id","period_index") WHERE "bell_schedule_periods"."status" = 'active';--> statement-breakpoint
CREATE INDEX "bell_schedules_institution_idx" ON "bell_schedules" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "bell_schedules_campus_idx" ON "bell_schedules" USING btree ("campus_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bell_schedules_default_per_campus_idx" ON "bell_schedules" USING btree ("campus_id") WHERE "bell_schedules"."is_default" IS TRUE AND "bell_schedules"."status" != 'deleted';--> statement-breakpoint
CREATE UNIQUE INDEX "bell_schedules_name_per_campus_unique_idx" ON "bell_schedules" USING btree ("campus_id","name") WHERE "bell_schedules"."status" != 'deleted';--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_bell_schedule_period_id_bell_schedule_periods_id_fk" FOREIGN KEY ("bell_schedule_period_id") REFERENCES "public"."bell_schedule_periods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_staff_id_member_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "timetable_entries_staff_idx" ON "timetable_entries" USING btree ("staff_id");
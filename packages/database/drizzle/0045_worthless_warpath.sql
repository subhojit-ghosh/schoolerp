CREATE TABLE "notification_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"channel_sms" boolean DEFAULT true NOT NULL,
	"channel_email" boolean DEFAULT true NOT NULL,
	"channel_in_app" boolean DEFAULT true NOT NULL,
	"quiet_hours_start" text,
	"quiet_hours_end" text,
	"digest_mode" text DEFAULT 'instant' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ptm_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"campus_id" text,
	"title" text NOT NULL,
	"description" text,
	"ptm_date" date NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"slot_duration_minutes" integer DEFAULT 15 NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ptm_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"ptm_session_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"teacher_membership_id" text NOT NULL,
	"student_membership_id" text,
	"parent_membership_id" text,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"feedback" text,
	"attendance_marked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ptm_sessions" ADD CONSTRAINT "ptm_sessions_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ptm_sessions" ADD CONSTRAINT "ptm_sessions_campus_id_campus_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ptm_slots" ADD CONSTRAINT "ptm_slots_ptm_session_id_ptm_sessions_id_fk" FOREIGN KEY ("ptm_session_id") REFERENCES "public"."ptm_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ptm_slots" ADD CONSTRAINT "ptm_slots_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ptm_slots" ADD CONSTRAINT "ptm_slots_teacher_membership_id_member_id_fk" FOREIGN KEY ("teacher_membership_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ptm_slots" ADD CONSTRAINT "ptm_slots_student_membership_id_member_id_fk" FOREIGN KEY ("student_membership_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ptm_slots" ADD CONSTRAINT "ptm_slots_parent_membership_id_member_id_fk" FOREIGN KEY ("parent_membership_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_prefs_user_institution_idx" ON "notification_preferences" USING btree ("user_id","institution_id");--> statement-breakpoint
CREATE INDEX "ptm_sessions_institution_idx" ON "ptm_sessions" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "ptm_sessions_date_idx" ON "ptm_sessions" USING btree ("ptm_date");--> statement-breakpoint
CREATE INDEX "ptm_slots_session_idx" ON "ptm_slots" USING btree ("ptm_session_id");--> statement-breakpoint
CREATE INDEX "ptm_slots_teacher_idx" ON "ptm_slots" USING btree ("teacher_membership_id");--> statement-breakpoint
CREATE INDEX "ptm_slots_student_idx" ON "ptm_slots" USING btree ("student_membership_id");
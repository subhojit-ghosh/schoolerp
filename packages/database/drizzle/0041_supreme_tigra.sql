CREATE TABLE "staff_attendance_records" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"campus_id" text NOT NULL,
	"staff_membership_id" text NOT NULL,
	"attendance_date" date NOT NULL,
	"status" text NOT NULL,
	"marked_by_membership_id" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "honorific" text;--> statement-breakpoint
ALTER TABLE "staff_attendance_records" ADD CONSTRAINT "staff_attendance_records_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_attendance_records" ADD CONSTRAINT "staff_attendance_records_campus_id_campus_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_attendance_records" ADD CONSTRAINT "staff_attendance_records_staff_membership_id_member_id_fk" FOREIGN KEY ("staff_membership_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_attendance_records" ADD CONSTRAINT "staff_attendance_records_marked_by_membership_id_member_id_fk" FOREIGN KEY ("marked_by_membership_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "staff_att_unique_idx" ON "staff_attendance_records" USING btree ("institution_id","staff_membership_id","attendance_date");--> statement-breakpoint
CREATE INDEX "staff_att_institution_date_idx" ON "staff_attendance_records" USING btree ("institution_id","attendance_date");--> statement-breakpoint
CREATE INDEX "staff_att_campus_date_idx" ON "staff_attendance_records" USING btree ("institution_id","campus_id","attendance_date");
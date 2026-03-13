CREATE TABLE "attendance_records" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"campus_id" text NOT NULL,
	"student_id" text NOT NULL,
	"attendance_date" date NOT NULL,
	"class_name" text NOT NULL,
	"section_name" text NOT NULL,
	"status" text NOT NULL,
	"marked_by_membership_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_records_student_date_unique" UNIQUE("institution_id","student_id","attendance_date")
);
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "class_name" text NOT NULL DEFAULT 'Unassigned';--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "section_name" text NOT NULL DEFAULT 'Unassigned';--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "class_name" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "section_name" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_campus_id_campus_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_marked_by_membership_id_member_id_fk" FOREIGN KEY ("marked_by_membership_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendance_records_day_idx" ON "attendance_records" USING btree ("institution_id","attendance_date");--> statement-breakpoint
CREATE INDEX "attendance_records_scope_idx" ON "attendance_records" USING btree ("institution_id","campus_id","attendance_date","class_name","section_name");--> statement-breakpoint
CREATE INDEX "students_class_section_idx" ON "students" USING btree ("institution_id","class_name","section_name");

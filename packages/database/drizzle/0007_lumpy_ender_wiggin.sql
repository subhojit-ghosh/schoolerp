CREATE TABLE "student_current_enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"student_membership_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"class_name" text NOT NULL,
	"section_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "student_current_enrollments" ADD CONSTRAINT "student_current_enrollments_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_current_enrollments" ADD CONSTRAINT "student_current_enrollments_student_membership_id_member_id_fk" FOREIGN KEY ("student_membership_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_current_enrollments" ADD CONSTRAINT "student_current_enrollments_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "student_current_enrollments_institution_idx" ON "student_current_enrollments" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "student_current_enrollments_student_membership_idx" ON "student_current_enrollments" USING btree ("student_membership_id");--> statement-breakpoint
CREATE INDEX "student_current_enrollments_academic_year_idx" ON "student_current_enrollments" USING btree ("academic_year_id");--> statement-breakpoint
CREATE UNIQUE INDEX "student_current_enrollments_active_unique_idx" ON "student_current_enrollments" USING btree ("student_membership_id") WHERE "student_current_enrollments"."deleted_at" IS NULL;
CREATE TABLE "staff_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"membership_id" text NOT NULL,
	"employee_id" text,
	"designation" text,
	"department" text,
	"date_of_joining" date,
	"date_of_birth" date,
	"gender" text,
	"blood_group" text,
	"address" text,
	"emergency_contact_name" text,
	"emergency_contact_mobile" text,
	"qualification" text,
	"experience_years" integer,
	"employment_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject_teacher_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"membership_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"class_id" text,
	"academic_year_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_membership_id_member_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_teacher_assignments" ADD CONSTRAINT "subject_teacher_assignments_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_teacher_assignments" ADD CONSTRAINT "subject_teacher_assignments_membership_id_member_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_teacher_assignments" ADD CONSTRAINT "subject_teacher_assignments_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_teacher_assignments" ADD CONSTRAINT "subject_teacher_assignments_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_teacher_assignments" ADD CONSTRAINT "subject_teacher_assignments_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "staff_profiles_institution_idx" ON "staff_profiles" USING btree ("institution_id");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_profiles_membership_unique_idx" ON "staff_profiles" USING btree ("membership_id");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_profiles_employee_id_unique_idx" ON "staff_profiles" USING btree ("institution_id","employee_id") WHERE "staff_profiles"."employee_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "subject_teacher_institution_idx" ON "subject_teacher_assignments" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "subject_teacher_membership_idx" ON "subject_teacher_assignments" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "subject_teacher_subject_idx" ON "subject_teacher_assignments" USING btree ("subject_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subject_teacher_unique_idx" ON "subject_teacher_assignments" USING btree ("membership_id","subject_id","class_id") WHERE "subject_teacher_assignments"."deleted_at" IS NULL;
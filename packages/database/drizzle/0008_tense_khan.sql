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
CREATE TABLE "exam_marks" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"exam_term_id" text NOT NULL,
	"student_id" text NOT NULL,
	"subject_name" text NOT NULL,
	"max_marks" integer NOT NULL,
	"obtained_marks" integer NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_terms" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "fee_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"fee_structure_id" text NOT NULL,
	"student_id" text NOT NULL,
	"assigned_amount_in_paise" integer NOT NULL,
	"due_date" date NOT NULL,
	"status" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "fee_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"fee_assignment_id" text NOT NULL,
	"amount_in_paise" integer NOT NULL,
	"payment_date" date NOT NULL,
	"payment_method" text NOT NULL,
	"reference_number" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "fee_structures" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"campus_id" text,
	"name" text NOT NULL,
	"description" text,
	"scope" text NOT NULL,
	"amount_in_paise" integer NOT NULL,
	"due_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
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
ALTER TABLE "students" ADD COLUMN "class_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "section_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_campus_id_campus_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_marked_by_membership_id_member_id_fk" FOREIGN KEY ("marked_by_membership_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_exam_term_id_exam_terms_id_fk" FOREIGN KEY ("exam_term_id") REFERENCES "public"."exam_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_terms" ADD CONSTRAINT "exam_terms_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_terms" ADD CONSTRAINT "exam_terms_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_assignments" ADD CONSTRAINT "fee_assignments_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_assignments" ADD CONSTRAINT "fee_assignments_fee_structure_id_fee_structures_id_fk" FOREIGN KEY ("fee_structure_id") REFERENCES "public"."fee_structures"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_assignments" ADD CONSTRAINT "fee_assignments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_fee_assignment_id_fee_assignments_id_fk" FOREIGN KEY ("fee_assignment_id") REFERENCES "public"."fee_assignments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_campus_id_campus_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_current_enrollments" ADD CONSTRAINT "student_current_enrollments_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_current_enrollments" ADD CONSTRAINT "student_current_enrollments_student_membership_id_member_id_fk" FOREIGN KEY ("student_membership_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_current_enrollments" ADD CONSTRAINT "student_current_enrollments_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendance_records_day_idx" ON "attendance_records" USING btree ("institution_id","attendance_date");--> statement-breakpoint
CREATE INDEX "attendance_records_scope_idx" ON "attendance_records" USING btree ("institution_id","campus_id","attendance_date","class_name","section_name");--> statement-breakpoint
CREATE INDEX "exam_marks_term_idx" ON "exam_marks" USING btree ("exam_term_id");--> statement-breakpoint
CREATE INDEX "exam_marks_student_idx" ON "exam_marks" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_marks_subject_unique_idx" ON "exam_marks" USING btree ("exam_term_id","student_id","subject_name");--> statement-breakpoint
CREATE INDEX "exam_terms_institution_idx" ON "exam_terms" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "exam_terms_academic_year_idx" ON "exam_terms" USING btree ("academic_year_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_terms_name_unique_idx" ON "exam_terms" USING btree ("institution_id","academic_year_id","name") WHERE "exam_terms"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "fee_assignments_institution_idx" ON "fee_assignments" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "fee_assignments_structure_idx" ON "fee_assignments" USING btree ("fee_structure_id");--> statement-breakpoint
CREATE INDEX "fee_assignments_student_idx" ON "fee_assignments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "fee_assignments_due_date_idx" ON "fee_assignments" USING btree ("due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "fee_assignments_student_structure_unique_idx" ON "fee_assignments" USING btree ("student_id","fee_structure_id") WHERE "fee_assignments"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "fee_payments_institution_idx" ON "fee_payments" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "fee_payments_assignment_idx" ON "fee_payments" USING btree ("fee_assignment_id");--> statement-breakpoint
CREATE INDEX "fee_payments_payment_date_idx" ON "fee_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "fee_structures_institution_idx" ON "fee_structures" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "fee_structures_academic_year_idx" ON "fee_structures" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "fee_structures_campus_idx" ON "fee_structures" USING btree ("campus_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fee_structures_name_scope_unique_idx" ON "fee_structures" USING btree ("institution_id","academic_year_id","campus_id","name") WHERE "fee_structures"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "student_current_enrollments_institution_idx" ON "student_current_enrollments" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "student_current_enrollments_student_membership_idx" ON "student_current_enrollments" USING btree ("student_membership_id");--> statement-breakpoint
CREATE INDEX "student_current_enrollments_academic_year_idx" ON "student_current_enrollments" USING btree ("academic_year_id");--> statement-breakpoint
CREATE UNIQUE INDEX "student_current_enrollments_active_unique_idx" ON "student_current_enrollments" USING btree ("student_membership_id") WHERE "student_current_enrollments"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "students_class_section_idx" ON "students" USING btree ("institution_id","class_name","section_name");
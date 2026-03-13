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
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_exam_term_id_exam_terms_id_fk" FOREIGN KEY ("exam_term_id") REFERENCES "public"."exam_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_terms" ADD CONSTRAINT "exam_terms_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_terms" ADD CONSTRAINT "exam_terms_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exam_marks_term_idx" ON "exam_marks" USING btree ("exam_term_id");--> statement-breakpoint
CREATE INDEX "exam_marks_student_idx" ON "exam_marks" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_marks_subject_unique_idx" ON "exam_marks" USING btree ("exam_term_id","student_id","subject_name");--> statement-breakpoint
CREATE INDEX "exam_terms_institution_idx" ON "exam_terms" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "exam_terms_academic_year_idx" ON "exam_terms" USING btree ("academic_year_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_terms_name_unique_idx" ON "exam_terms" USING btree ("institution_id","academic_year_id","name") WHERE "exam_terms"."deleted_at" IS NULL;
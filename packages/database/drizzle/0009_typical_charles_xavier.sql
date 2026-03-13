DROP INDEX "attendance_records_scope_idx";--> statement-breakpoint
DROP INDEX "students_class_section_idx";--> statement-breakpoint
ALTER TABLE "attendance_records" ADD COLUMN "class_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD COLUMN "section_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "student_current_enrollments" ADD COLUMN "class_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "student_current_enrollments" ADD COLUMN "section_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "class_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "section_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_current_enrollments" ADD CONSTRAINT "student_current_enrollments_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_current_enrollments" ADD CONSTRAINT "student_current_enrollments_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendance_records_scope_idx" ON "attendance_records" USING btree ("institution_id","campus_id","attendance_date","class_id","section_id");--> statement-breakpoint
CREATE INDEX "students_class_section_idx" ON "students" USING btree ("institution_id","class_id","section_id");--> statement-breakpoint
ALTER TABLE "attendance_records" DROP COLUMN "class_name";--> statement-breakpoint
ALTER TABLE "attendance_records" DROP COLUMN "section_name";--> statement-breakpoint
ALTER TABLE "student_current_enrollments" DROP COLUMN "class_name";--> statement-breakpoint
ALTER TABLE "student_current_enrollments" DROP COLUMN "section_name";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "class_name";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "section_name";
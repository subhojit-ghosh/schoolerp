DROP INDEX "sections_class_active_idx";--> statement-breakpoint
DROP INDEX "academic_years_single_current_per_institution_idx";--> statement-breakpoint
DROP INDEX "sections_name_per_class_unique_idx";--> statement-breakpoint
DROP INDEX "classes_name_per_campus_unique_idx";--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
CREATE INDEX "sections_class_status_idx" ON "sections" USING btree ("class_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "academic_years_single_current_per_institution_idx" ON "academic_years" USING btree ("institution_id") WHERE "academic_years"."is_current" IS TRUE AND "academic_years"."status" != 'deleted';--> statement-breakpoint
CREATE UNIQUE INDEX "sections_name_per_class_unique_idx" ON "sections" USING btree ("class_id","name") WHERE "sections"."status" = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "classes_name_per_campus_unique_idx" ON "classes" USING btree ("campus_id","name") WHERE "classes"."status" != 'deleted';--> statement-breakpoint
ALTER TABLE "sections" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "sections" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "classes" DROP COLUMN "is_active";
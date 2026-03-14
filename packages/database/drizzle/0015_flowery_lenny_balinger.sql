DROP INDEX "sections_name_per_class_unique_idx";--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
UPDATE "sections" SET "is_active" = false WHERE "deleted_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "sections_class_active_idx" ON "sections" USING btree ("class_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "sections_name_per_class_unique_idx" ON "sections" USING btree ("class_id","name") WHERE "sections"."is_active" IS TRUE AND "sections"."deleted_at" IS NULL;

DROP INDEX "campus_slug_org_unique_idx";--> statement-breakpoint
DROP INDEX "campus_single_default_per_org_idx";--> statement-breakpoint
DROP INDEX "member_org_user_active_unique_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "campus_slug_org_unique_idx" ON "campus" USING btree ("organization_id","slug") WHERE "campus"."status" != 'deleted';--> statement-breakpoint
CREATE UNIQUE INDEX "campus_single_default_per_org_idx" ON "campus" USING btree ("organization_id") WHERE "campus"."is_default" IS TRUE AND "campus"."status" != 'deleted';--> statement-breakpoint
CREATE UNIQUE INDEX "member_org_user_active_unique_idx" ON "member" USING btree ("organization_id","user_id","member_type") WHERE "member"."status" != 'deleted';
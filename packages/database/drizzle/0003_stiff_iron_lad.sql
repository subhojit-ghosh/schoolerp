CREATE TABLE "students" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"membership_id" text NOT NULL,
	"admission_number" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "auth_rate_limit_event" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "member_org_user_active_unique_idx";--> statement-breakpoint
ALTER TABLE "member" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_membership_id_member_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "students_institution_idx" ON "students" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "students_membership_idx" ON "students" USING btree ("membership_id");--> statement-breakpoint
CREATE UNIQUE INDEX "students_membership_active_unique_idx" ON "students" USING btree ("membership_id") WHERE "students"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "students_admission_number_unique_idx" ON "students" USING btree ("institution_id","admission_number") WHERE "students"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "auth_rate_limit_action_key_idx" ON "auth_rate_limit_event" USING btree ("action","key");--> statement-breakpoint
CREATE INDEX "auth_rate_limit_created_at_idx" ON "auth_rate_limit_event" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "member_org_user_active_unique_idx" ON "member" USING btree ("organization_id","user_id","member_type") WHERE "member"."deleted_at" IS NULL;
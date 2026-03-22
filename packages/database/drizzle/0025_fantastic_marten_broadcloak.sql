CREATE TABLE "platform_admin" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"totp_secret" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_admin_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_mobile_unique";--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_email_unique";--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "custom_domain" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "institution_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "must_change_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_institution_idx" ON "user" USING btree ("institution_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_institution_mobile_unique_idx" ON "user" USING btree ("institution_id","mobile");--> statement-breakpoint
CREATE UNIQUE INDEX "user_institution_email_unique_idx" ON "user" USING btree ("institution_id","email") WHERE "user"."email" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "student_guardian_links" DROP COLUMN "invited_at";--> statement-breakpoint
ALTER TABLE "student_guardian_links" DROP COLUMN "accepted_at";--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_customDomain_unique" UNIQUE("custom_domain");
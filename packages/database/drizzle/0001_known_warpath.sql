CREATE TABLE "password_reset_token" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "password_reset_token_user_idx" ON "password_reset_token" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_reset_token_expires_idx" ON "password_reset_token" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_token_active_user_unique_idx" ON "password_reset_token" USING btree ("user_id") WHERE "password_reset_token"."consumed_at" IS NULL;
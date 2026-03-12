ALTER TABLE "password_reset_token" RENAME COLUMN "token" TO "token_hash";--> statement-breakpoint
ALTER TABLE "password_reset_token" DROP CONSTRAINT "password_reset_token_token_unique";--> statement-breakpoint
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_token_hash_unique" UNIQUE("token_hash");
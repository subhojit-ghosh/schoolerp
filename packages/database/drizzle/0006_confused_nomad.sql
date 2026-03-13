ALTER TABLE "session" ADD COLUMN "active_context_key" text;--> statement-breakpoint
CREATE INDEX "session_context_idx" ON "session" USING btree ("active_context_key");
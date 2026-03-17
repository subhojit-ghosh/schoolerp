CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"actor_user_id" text NOT NULL,
	"actor_campus_id" text,
	"actor_context_key" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"entity_label" text,
	"summary" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_campus_id_campus_id_fk" FOREIGN KEY ("actor_campus_id") REFERENCES "public"."campus"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_institution_created_at_idx" ON "audit_logs" USING btree ("institution_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_institution_entity_idx" ON "audit_logs" USING btree ("institution_id","entity_type","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_institution_action_idx" ON "audit_logs" USING btree ("institution_id","action","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_user_idx" ON "audit_logs" USING btree ("actor_user_id","created_at");
CREATE TABLE "fee_assignment_adjustments" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"fee_assignment_id" text NOT NULL,
	"adjustment_type" text NOT NULL,
	"amount_in_paise" integer NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_payment_reversals" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"fee_payment_id" text NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "fee_structures_name_scope_unique_idx";--> statement-breakpoint
ALTER TABLE "fee_structures" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_assignment_adjustments" ADD CONSTRAINT "fee_assignment_adjustments_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_assignment_adjustments" ADD CONSTRAINT "fee_assignment_adjustments_fee_assignment_id_fee_assignments_id_fk" FOREIGN KEY ("fee_assignment_id") REFERENCES "public"."fee_assignments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payment_reversals" ADD CONSTRAINT "fee_payment_reversals_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payment_reversals" ADD CONSTRAINT "fee_payment_reversals_fee_payment_id_fee_payments_id_fk" FOREIGN KEY ("fee_payment_id") REFERENCES "public"."fee_payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fee_assignment_adjustments_institution_idx" ON "fee_assignment_adjustments" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "fee_assignment_adjustments_assignment_idx" ON "fee_assignment_adjustments" USING btree ("fee_assignment_id");--> statement-breakpoint
CREATE INDEX "fee_payment_reversals_institution_idx" ON "fee_payment_reversals" USING btree ("institution_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fee_payment_reversals_payment_unique_idx" ON "fee_payment_reversals" USING btree ("fee_payment_id");--> statement-breakpoint
CREATE INDEX "fee_structures_status_idx" ON "fee_structures" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "fee_structures_name_scope_unique_idx" ON "fee_structures" USING btree ("institution_id","academic_year_id","campus_id","name") WHERE "fee_structures"."status" != 'deleted';
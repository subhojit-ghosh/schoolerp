CREATE TABLE "fee_structure_installments" (
	"id" text PRIMARY KEY NOT NULL,
	"fee_structure_id" text NOT NULL,
	"sort_order" integer NOT NULL,
	"label" text NOT NULL,
	"amount_in_paise" integer NOT NULL,
	"due_date" date NOT NULL
);
--> statement-breakpoint
DROP INDEX "fee_assignments_student_structure_unique_idx";--> statement-breakpoint
ALTER TABLE "fee_assignments" ADD COLUMN "installment_id" text;--> statement-breakpoint
ALTER TABLE "fee_structure_installments" ADD CONSTRAINT "fee_structure_installments_fee_structure_id_fee_structures_id_fk" FOREIGN KEY ("fee_structure_id") REFERENCES "public"."fee_structures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fee_structure_installments_structure_idx" ON "fee_structure_installments" USING btree ("fee_structure_id");--> statement-breakpoint
ALTER TABLE "fee_assignments" ADD CONSTRAINT "fee_assignments_installment_id_fee_structure_installments_id_fk" FOREIGN KEY ("installment_id") REFERENCES "public"."fee_structure_installments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fee_assignments_student_installment_unique_idx" ON "fee_assignments" USING btree ("student_id","installment_id") WHERE "fee_assignments"."installment_id" IS NOT NULL AND "fee_assignments"."deleted_at" IS NULL;
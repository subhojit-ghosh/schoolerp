CREATE TABLE "fee_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"fee_structure_id" text NOT NULL,
	"student_id" text NOT NULL,
	"assigned_amount_in_paise" integer NOT NULL,
	"due_date" date NOT NULL,
	"status" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "fee_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"fee_assignment_id" text NOT NULL,
	"amount_in_paise" integer NOT NULL,
	"payment_date" date NOT NULL,
	"payment_method" text NOT NULL,
	"reference_number" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "fee_structures" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"campus_id" text,
	"name" text NOT NULL,
	"description" text,
	"scope" text NOT NULL,
	"amount_in_paise" integer NOT NULL,
	"due_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "fee_assignments" ADD CONSTRAINT "fee_assignments_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_assignments" ADD CONSTRAINT "fee_assignments_fee_structure_id_fee_structures_id_fk" FOREIGN KEY ("fee_structure_id") REFERENCES "public"."fee_structures"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_assignments" ADD CONSTRAINT "fee_assignments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_fee_assignment_id_fee_assignments_id_fk" FOREIGN KEY ("fee_assignment_id") REFERENCES "public"."fee_assignments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_campus_id_campus_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fee_assignments_institution_idx" ON "fee_assignments" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "fee_assignments_structure_idx" ON "fee_assignments" USING btree ("fee_structure_id");--> statement-breakpoint
CREATE INDEX "fee_assignments_student_idx" ON "fee_assignments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "fee_assignments_due_date_idx" ON "fee_assignments" USING btree ("due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "fee_assignments_student_structure_unique_idx" ON "fee_assignments" USING btree ("student_id","fee_structure_id") WHERE "fee_assignments"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "fee_payments_institution_idx" ON "fee_payments" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "fee_payments_assignment_idx" ON "fee_payments" USING btree ("fee_assignment_id");--> statement-breakpoint
CREATE INDEX "fee_payments_payment_date_idx" ON "fee_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "fee_structures_institution_idx" ON "fee_structures" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "fee_structures_academic_year_idx" ON "fee_structures" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "fee_structures_campus_idx" ON "fee_structures" USING btree ("campus_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fee_structures_name_scope_unique_idx" ON "fee_structures" USING btree ("institution_id","academic_year_id","campus_id","name") WHERE "fee_structures"."deleted_at" IS NULL;
CREATE TABLE "grading_scale_bands" (
	"id" text PRIMARY KEY NOT NULL,
	"grading_scale_id" text NOT NULL,
	"grade" text NOT NULL,
	"label" text NOT NULL,
	"min_percent" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grading_scales" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "institution_document_config" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"receipt_prefix" text DEFAULT 'RCT' NOT NULL,
	"receipt_next_number" integer DEFAULT 1 NOT NULL,
	"receipt_pad_length" integer DEFAULT 6 NOT NULL,
	"report_card_config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "institution_document_config_institutionId_unique" UNIQUE("institution_id")
);
--> statement-breakpoint
CREATE TABLE "institution_signatories" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"designation" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "late_fee_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"fee_structure_id" text,
	"calculation_type" text NOT NULL,
	"amount_in_paise" integer NOT NULL,
	"grace_period_days" integer DEFAULT 0 NOT NULL,
	"max_amount_in_paise" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exam_marks" ADD COLUMN "grace_marks" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_terms" ADD COLUMN "exam_type" text DEFAULT 'final' NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_terms" ADD COLUMN "weightage_in_bp" integer DEFAULT 10000 NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_terms" ADD COLUMN "grading_scale_id" text;--> statement-breakpoint
ALTER TABLE "exam_terms" ADD COLUMN "default_passing_percent" integer DEFAULT 33 NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD COLUMN "receipt_number" text;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "grading_scale_bands" ADD CONSTRAINT "grading_scale_bands_grading_scale_id_grading_scales_id_fk" FOREIGN KEY ("grading_scale_id") REFERENCES "public"."grading_scales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grading_scales" ADD CONSTRAINT "grading_scales_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institution_document_config" ADD CONSTRAINT "institution_document_config_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institution_signatories" ADD CONSTRAINT "institution_signatories_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "late_fee_rules" ADD CONSTRAINT "late_fee_rules_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "late_fee_rules" ADD CONSTRAINT "late_fee_rules_fee_structure_id_fee_structures_id_fk" FOREIGN KEY ("fee_structure_id") REFERENCES "public"."fee_structures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "grading_scale_bands_scale_idx" ON "grading_scale_bands" USING btree ("grading_scale_id");--> statement-breakpoint
CREATE UNIQUE INDEX "grading_scale_bands_grade_unique_idx" ON "grading_scale_bands" USING btree ("grading_scale_id","grade");--> statement-breakpoint
CREATE INDEX "grading_scales_institution_idx" ON "grading_scales" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "grading_scales_status_idx" ON "grading_scales" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "grading_scales_name_unique_idx" ON "grading_scales" USING btree ("institution_id","name") WHERE "grading_scales"."status" != 'deleted';--> statement-breakpoint
CREATE INDEX "institution_document_config_institution_idx" ON "institution_document_config" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "institution_signatories_institution_idx" ON "institution_signatories" USING btree ("institution_id");--> statement-breakpoint
CREATE UNIQUE INDEX "institution_signatories_unique_idx" ON "institution_signatories" USING btree ("institution_id","name","designation") WHERE "institution_signatories"."is_active" = true;--> statement-breakpoint
CREATE INDEX "late_fee_rules_institution_idx" ON "late_fee_rules" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "late_fee_rules_structure_idx" ON "late_fee_rules" USING btree ("fee_structure_id");--> statement-breakpoint
ALTER TABLE "exam_terms" ADD CONSTRAINT "exam_terms_grading_scale_id_grading_scales_id_fk" FOREIGN KEY ("grading_scale_id") REFERENCES "public"."grading_scales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fee_payments_receipt_number_unique_idx" ON "fee_payments" USING btree ("institution_id","receipt_number") WHERE "fee_payments"."receipt_number" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "fee_structures_category_idx" ON "fee_structures" USING btree ("category");
CREATE TABLE "payroll_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"campus_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_earnings_in_paise" integer DEFAULT 0 NOT NULL,
	"total_deductions_in_paise" integer DEFAULT 0 NOT NULL,
	"total_net_pay_in_paise" integer DEFAULT 0 NOT NULL,
	"staff_count" integer DEFAULT 0 NOT NULL,
	"working_days" integer DEFAULT 26 NOT NULL,
	"processed_by_member_id" text,
	"approved_by_member_id" text,
	"processed_at" timestamp,
	"approved_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payslip_line_items" (
	"id" text PRIMARY KEY NOT NULL,
	"payslip_id" text NOT NULL,
	"salary_component_id" text NOT NULL,
	"component_name" text NOT NULL,
	"component_type" text NOT NULL,
	"amount_in_paise" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payslips" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"payroll_run_id" text NOT NULL,
	"staff_profile_id" text NOT NULL,
	"salary_assignment_id" text NOT NULL,
	"staff_name" text NOT NULL,
	"staff_employee_id" text,
	"staff_designation" text,
	"staff_department" text,
	"working_days" integer NOT NULL,
	"present_days" integer NOT NULL,
	"paid_leave_days" integer DEFAULT 0 NOT NULL,
	"unpaid_leave_days" integer DEFAULT 0 NOT NULL,
	"total_earnings_in_paise" integer NOT NULL,
	"total_deductions_in_paise" integer NOT NULL,
	"net_pay_in_paise" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payslips_run_staff_unique" UNIQUE("payroll_run_id","staff_profile_id")
);
--> statement-breakpoint
CREATE TABLE "salary_components" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"calculation_type" text NOT NULL,
	"is_taxable" boolean DEFAULT true NOT NULL,
	"is_statutory" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "salary_template_components" (
	"id" text PRIMARY KEY NOT NULL,
	"salary_template_id" text NOT NULL,
	"salary_component_id" text NOT NULL,
	"amount_in_paise" integer,
	"percentage" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "salary_template_components_unique" UNIQUE("salary_template_id","salary_component_id")
);
--> statement-breakpoint
CREATE TABLE "salary_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "staff_salary_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"staff_profile_id" text NOT NULL,
	"salary_template_id" text NOT NULL,
	"effective_from" date NOT NULL,
	"ctc_in_paise" integer NOT NULL,
	"overrides" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_campus_id_campus_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_processed_by_member_id_member_id_fk" FOREIGN KEY ("processed_by_member_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_approved_by_member_id_member_id_fk" FOREIGN KEY ("approved_by_member_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslip_line_items" ADD CONSTRAINT "payslip_line_items_payslip_id_payslips_id_fk" FOREIGN KEY ("payslip_id") REFERENCES "public"."payslips"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslip_line_items" ADD CONSTRAINT "payslip_line_items_salary_component_id_salary_components_id_fk" FOREIGN KEY ("salary_component_id") REFERENCES "public"."salary_components"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_salary_assignment_id_staff_salary_assignments_id_fk" FOREIGN KEY ("salary_assignment_id") REFERENCES "public"."staff_salary_assignments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_components" ADD CONSTRAINT "salary_components_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_template_components" ADD CONSTRAINT "salary_template_components_salary_template_id_salary_templates_id_fk" FOREIGN KEY ("salary_template_id") REFERENCES "public"."salary_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_template_components" ADD CONSTRAINT "salary_template_components_salary_component_id_salary_components_id_fk" FOREIGN KEY ("salary_component_id") REFERENCES "public"."salary_components"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_templates" ADD CONSTRAINT "salary_templates_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_salary_assignments" ADD CONSTRAINT "staff_salary_assignments_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_salary_assignments" ADD CONSTRAINT "staff_salary_assignments_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_salary_assignments" ADD CONSTRAINT "staff_salary_assignments_salary_template_id_salary_templates_id_fk" FOREIGN KEY ("salary_template_id") REFERENCES "public"."salary_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payroll_runs_institution_idx" ON "payroll_runs" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "payroll_runs_status_idx" ON "payroll_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payroll_runs_month_year_idx" ON "payroll_runs" USING btree ("institution_id","year","month");--> statement-breakpoint
CREATE INDEX "payslip_line_items_payslip_idx" ON "payslip_line_items" USING btree ("payslip_id");--> statement-breakpoint
CREATE INDEX "payslips_institution_idx" ON "payslips" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "payslips_payroll_run_idx" ON "payslips" USING btree ("payroll_run_id");--> statement-breakpoint
CREATE INDEX "payslips_staff_profile_idx" ON "payslips" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "salary_components_institution_idx" ON "salary_components" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "salary_components_status_idx" ON "salary_components" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "salary_components_name_unique_idx" ON "salary_components" USING btree ("institution_id","name") WHERE "salary_components"."status" != 'deleted';--> statement-breakpoint
CREATE INDEX "salary_template_components_template_idx" ON "salary_template_components" USING btree ("salary_template_id");--> statement-breakpoint
CREATE INDEX "salary_templates_institution_idx" ON "salary_templates" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "salary_templates_status_idx" ON "salary_templates" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "salary_templates_name_unique_idx" ON "salary_templates" USING btree ("institution_id","name") WHERE "salary_templates"."status" != 'deleted';--> statement-breakpoint
CREATE INDEX "staff_salary_assignments_institution_idx" ON "staff_salary_assignments" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "staff_salary_assignments_staff_idx" ON "staff_salary_assignments" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "staff_salary_assignments_status_idx" ON "staff_salary_assignments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_salary_assignments_active_unique_idx" ON "staff_salary_assignments" USING btree ("staff_profile_id") WHERE "staff_salary_assignments"."status" = 'active';
CREATE TABLE "broadcast_delivery_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"broadcast_id" text NOT NULL,
	"recipient_user_id" text NOT NULL,
	"channel" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"delivered_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_consents" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"user_id" text NOT NULL,
	"purpose" text NOT NULL,
	"status" text DEFAULT 'granted' NOT NULL,
	"consented_at" timestamp DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domain_events" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"last_error" text,
	"processed_at" timestamp,
	"scheduled_for" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emergency_broadcasts" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"template_key" text,
	"target_type" text NOT NULL,
	"target_id" text,
	"priority" text DEFAULT 'normal' NOT NULL,
	"channels" jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"sent_at" timestamp,
	"sent_by_member_id" text NOT NULL,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"delivered_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"budget_head_code" text,
	"parent_category_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"campus_id" text,
	"category_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"amount_in_paise" integer NOT NULL,
	"expense_date" date NOT NULL,
	"department_name" text,
	"vendor_name" text,
	"reference_number" text,
	"receipt_upload_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"submitted_by_member_id" text NOT NULL,
	"approved_by_member_id" text,
	"approved_at" timestamp,
	"rejection_reason" text,
	"paid_at" timestamp,
	"payment_method" text,
	"payment_reference" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_uploads" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"original_filename" text NOT NULL,
	"storage_path" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "income_records" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"campus_id" text,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"amount_in_paise" integer NOT NULL,
	"income_date" date NOT NULL,
	"source_entity" text,
	"reference_number" text,
	"receipt_upload_id" text,
	"recorded_by_member_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "institution_session_config" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"max_concurrent_sessions" integer DEFAULT 3 NOT NULL,
	"session_timeout_minutes" integer DEFAULT 30 NOT NULL,
	"require_reauth_for_sensitive_ops" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "institution_session_config_institutionId_unique" UNIQUE("institution_id")
);
--> statement-breakpoint
CREATE TABLE "scholarship_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"scholarship_id" text NOT NULL,
	"student_id" text NOT NULL,
	"applied_by_member_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by_member_id" text,
	"reviewed_at" timestamp,
	"review_notes" text,
	"dbt_status" text DEFAULT 'not_applied' NOT NULL,
	"dbt_transaction_id" text,
	"dbt_disbursed_at" timestamp,
	"fee_adjustment_id" text,
	"concession_amount_in_paise" integer,
	"expires_at" timestamp,
	"renewed_from_application_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scholarships" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"scholarship_type" text NOT NULL,
	"amount_in_paise" integer,
	"percentage_discount" integer,
	"eligibility_criteria" text,
	"max_recipients" integer,
	"academic_year_id" text,
	"renewal_required" boolean DEFAULT false NOT NULL,
	"renewal_period_months" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sensitive_data_access_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"accessed_by_user_id" text NOT NULL,
	"data_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "broadcast_delivery_logs" ADD CONSTRAINT "broadcast_delivery_logs_broadcast_id_emergency_broadcasts_id_fk" FOREIGN KEY ("broadcast_id") REFERENCES "public"."emergency_broadcasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_delivery_logs" ADD CONSTRAINT "broadcast_delivery_logs_recipient_user_id_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_consents" ADD CONSTRAINT "data_consents_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_consents" ADD CONSTRAINT "data_consents_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_events" ADD CONSTRAINT "domain_events_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_broadcasts" ADD CONSTRAINT "emergency_broadcasts_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_broadcasts" ADD CONSTRAINT "emergency_broadcasts_sent_by_member_id_member_id_fk" FOREIGN KEY ("sent_by_member_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_campus_id_campus_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_submitted_by_member_id_member_id_fk" FOREIGN KEY ("submitted_by_member_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_member_id_member_id_fk" FOREIGN KEY ("approved_by_member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_uploaded_by_user_id_user_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_records" ADD CONSTRAINT "income_records_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_records" ADD CONSTRAINT "income_records_campus_id_campus_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_records" ADD CONSTRAINT "income_records_recorded_by_member_id_member_id_fk" FOREIGN KEY ("recorded_by_member_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institution_session_config" ADD CONSTRAINT "institution_session_config_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarship_applications" ADD CONSTRAINT "scholarship_applications_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarship_applications" ADD CONSTRAINT "scholarship_applications_scholarship_id_scholarships_id_fk" FOREIGN KEY ("scholarship_id") REFERENCES "public"."scholarships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarship_applications" ADD CONSTRAINT "scholarship_applications_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarship_applications" ADD CONSTRAINT "scholarship_applications_applied_by_member_id_member_id_fk" FOREIGN KEY ("applied_by_member_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarship_applications" ADD CONSTRAINT "scholarship_applications_reviewed_by_member_id_member_id_fk" FOREIGN KEY ("reviewed_by_member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensitive_data_access_logs" ADD CONSTRAINT "sensitive_data_access_logs_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensitive_data_access_logs" ADD CONSTRAINT "sensitive_data_access_logs_accessed_by_user_id_user_id_fk" FOREIGN KEY ("accessed_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "broadcast_delivery_broadcast_idx" ON "broadcast_delivery_logs" USING btree ("broadcast_id");--> statement-breakpoint
CREATE INDEX "broadcast_delivery_recipient_idx" ON "broadcast_delivery_logs" USING btree ("recipient_user_id");--> statement-breakpoint
CREATE INDEX "broadcast_delivery_status_idx" ON "broadcast_delivery_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "data_consents_institution_idx" ON "data_consents" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "data_consents_user_idx" ON "data_consents" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "data_consents_user_purpose_unique_idx" ON "data_consents" USING btree ("user_id","purpose");--> statement-breakpoint
CREATE INDEX "domain_events_institution_idx" ON "domain_events" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "domain_events_status_idx" ON "domain_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "domain_events_type_idx" ON "domain_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "domain_events_created_at_idx" ON "domain_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "domain_events_scheduled_idx" ON "domain_events" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "emergency_broadcasts_institution_idx" ON "emergency_broadcasts" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "emergency_broadcasts_status_idx" ON "emergency_broadcasts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "emergency_broadcasts_sent_at_idx" ON "emergency_broadcasts" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "expense_categories_institution_idx" ON "expense_categories" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "expense_categories_status_idx" ON "expense_categories" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "expense_categories_name_unique_idx" ON "expense_categories" USING btree ("institution_id","name") WHERE "expense_categories"."status" != 'inactive';--> statement-breakpoint
CREATE INDEX "expenses_institution_idx" ON "expenses" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "expenses_campus_idx" ON "expenses" USING btree ("campus_id");--> statement-breakpoint
CREATE INDEX "expenses_category_idx" ON "expenses" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "expenses_status_idx" ON "expenses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "expenses_date_idx" ON "expenses" USING btree ("expense_date");--> statement-breakpoint
CREATE INDEX "expenses_submitted_by_idx" ON "expenses" USING btree ("submitted_by_member_id");--> statement-breakpoint
CREATE INDEX "file_uploads_institution_idx" ON "file_uploads" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "file_uploads_entity_idx" ON "file_uploads" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "file_uploads_uploaded_by_idx" ON "file_uploads" USING btree ("uploaded_by_user_id");--> statement-breakpoint
CREATE INDEX "income_records_institution_idx" ON "income_records" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "income_records_campus_idx" ON "income_records" USING btree ("campus_id");--> statement-breakpoint
CREATE INDEX "income_records_category_idx" ON "income_records" USING btree ("category");--> statement-breakpoint
CREATE INDEX "income_records_date_idx" ON "income_records" USING btree ("income_date");--> statement-breakpoint
CREATE INDEX "institution_session_config_institution_idx" ON "institution_session_config" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "scholarship_apps_institution_idx" ON "scholarship_applications" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "scholarship_apps_scholarship_idx" ON "scholarship_applications" USING btree ("scholarship_id");--> statement-breakpoint
CREATE INDEX "scholarship_apps_student_idx" ON "scholarship_applications" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "scholarship_apps_status_idx" ON "scholarship_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scholarship_apps_dbt_status_idx" ON "scholarship_applications" USING btree ("dbt_status");--> statement-breakpoint
CREATE UNIQUE INDEX "scholarship_apps_student_unique_idx" ON "scholarship_applications" USING btree ("scholarship_id","student_id") WHERE "scholarship_applications"."status" NOT IN ('rejected', 'expired');--> statement-breakpoint
CREATE INDEX "scholarships_institution_idx" ON "scholarships" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "scholarships_type_idx" ON "scholarships" USING btree ("scholarship_type");--> statement-breakpoint
CREATE INDEX "scholarships_status_idx" ON "scholarships" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scholarships_academic_year_idx" ON "scholarships" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "sensitive_access_institution_idx" ON "sensitive_data_access_logs" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "sensitive_access_user_idx" ON "sensitive_data_access_logs" USING btree ("accessed_by_user_id");--> statement-breakpoint
CREATE INDEX "sensitive_access_entity_idx" ON "sensitive_data_access_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "sensitive_access_created_at_idx" ON "sensitive_data_access_logs" USING btree ("created_at");
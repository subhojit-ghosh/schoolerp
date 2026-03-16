CREATE TABLE "admission_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"enquiry_id" text,
	"campus_id" text NOT NULL,
	"student_first_name" text NOT NULL,
	"student_last_name" text,
	"guardian_name" text NOT NULL,
	"mobile" text NOT NULL,
	"email" text,
	"desired_class_name" text,
	"desired_section_name" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "admission_enquiries" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"campus_id" text NOT NULL,
	"student_name" text NOT NULL,
	"guardian_name" text NOT NULL,
	"mobile" text NOT NULL,
	"email" text,
	"source" text,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_enquiry_id_admission_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."admission_enquiries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_campus_id_campus_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_enquiries" ADD CONSTRAINT "admission_enquiries_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_enquiries" ADD CONSTRAINT "admission_enquiries_campus_id_campus_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admission_applications_institution_idx" ON "admission_applications" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "admission_applications_enquiry_idx" ON "admission_applications" USING btree ("enquiry_id");--> statement-breakpoint
CREATE INDEX "admission_applications_campus_idx" ON "admission_applications" USING btree ("campus_id");--> statement-breakpoint
CREATE INDEX "admission_applications_status_idx" ON "admission_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "admission_enquiries_institution_idx" ON "admission_enquiries" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "admission_enquiries_campus_idx" ON "admission_enquiries" USING btree ("campus_id");--> statement-breakpoint
CREATE INDEX "admission_enquiries_status_idx" ON "admission_enquiries" USING btree ("status");
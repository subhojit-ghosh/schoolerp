CREATE TABLE "leave_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"staff_member_id" text NOT NULL,
	"leave_type_id" text NOT NULL,
	"from_date" date NOT NULL,
	"to_date" date NOT NULL,
	"days_count" integer NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by_member_id" text,
	"reviewed_at" timestamp,
	"review_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_types" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"max_days_per_year" integer,
	"is_paid" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_staff_member_id_member_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_reviewed_by_member_id_member_id_fk" FOREIGN KEY ("reviewed_by_member_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_types" ADD CONSTRAINT "leave_types_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leave_applications_institution_idx" ON "leave_applications" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "leave_applications_staff_idx" ON "leave_applications" USING btree ("staff_member_id");--> statement-breakpoint
CREATE INDEX "leave_applications_leave_type_idx" ON "leave_applications" USING btree ("leave_type_id");--> statement-breakpoint
CREATE INDEX "leave_applications_status_idx" ON "leave_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leave_applications_from_date_idx" ON "leave_applications" USING btree ("from_date");--> statement-breakpoint
CREATE INDEX "leave_types_institution_idx" ON "leave_types" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "leave_types_status_idx" ON "leave_types" USING btree ("status");
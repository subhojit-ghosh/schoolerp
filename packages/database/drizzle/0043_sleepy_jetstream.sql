CREATE TABLE "leave_balances" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"staff_member_id" text NOT NULL,
	"leave_type_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"allocated" integer DEFAULT 0 NOT NULL,
	"used" integer DEFAULT 0 NOT NULL,
	"carried_forward" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leave_applications" ADD COLUMN "is_half_day" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_types" ADD COLUMN "carry_forward_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_types" ADD COLUMN "is_half_day_allowed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_types" ADD COLUMN "leave_category" text DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_staff_member_id_member_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leave_balances_institution_idx" ON "leave_balances" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "leave_balances_staff_idx" ON "leave_balances" USING btree ("staff_member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "leave_balances_unique_idx" ON "leave_balances" USING btree ("staff_member_id","leave_type_id","academic_year_id");
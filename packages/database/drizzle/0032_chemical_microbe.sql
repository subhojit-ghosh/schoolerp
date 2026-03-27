CREATE TABLE "institution_delivery_config" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"channel" text NOT NULL,
	"provider" text NOT NULL,
	"credentials" text NOT NULL,
	"sender_identity" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "institution_payment_config" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"provider" text NOT NULL,
	"credentials" text NOT NULL,
	"webhook_secret" text,
	"display_label" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "institution_payment_config_institutionId_unique" UNIQUE("institution_id")
);
--> statement-breakpoint
CREATE TABLE "payment_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"fee_assignment_id" text NOT NULL,
	"amount_in_paise" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider" text NOT NULL,
	"external_order_id" text,
	"external_payment_id" text,
	"external_signature" text,
	"checkout_data" text,
	"student_name" text,
	"guardian_mobile" text,
	"guardian_email" text,
	"paid_at" timestamp,
	"failed_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "institution_delivery_config" ADD CONSTRAINT "institution_delivery_config_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institution_payment_config" ADD CONSTRAINT "institution_payment_config_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "institution_delivery_config_institution_idx" ON "institution_delivery_config" USING btree ("institution_id");--> statement-breakpoint
CREATE UNIQUE INDEX "institution_delivery_config_institution_channel_unique_idx" ON "institution_delivery_config" USING btree ("institution_id","channel");--> statement-breakpoint
CREATE INDEX "institution_payment_config_institution_idx" ON "institution_payment_config" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "payment_orders_institution_idx" ON "payment_orders" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "payment_orders_fee_assignment_idx" ON "payment_orders" USING btree ("fee_assignment_id");--> statement-breakpoint
CREATE INDEX "payment_orders_status_idx" ON "payment_orders" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_orders_external_order_unique_idx" ON "payment_orders" USING btree ("institution_id","external_order_id") WHERE "payment_orders"."external_order_id" IS NOT NULL;
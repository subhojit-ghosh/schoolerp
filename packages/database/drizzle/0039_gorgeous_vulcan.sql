CREATE TABLE "bed_allocations" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"room_id" text NOT NULL,
	"student_id" text NOT NULL,
	"bed_number" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hostel_buildings" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"building_type" text NOT NULL,
	"campus_id" text,
	"warden_membership_id" text,
	"capacity" integer DEFAULT 0 NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "hostel_rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"building_id" text NOT NULL,
	"room_number" text NOT NULL,
	"floor" integer DEFAULT 0 NOT NULL,
	"room_type" text NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"occupancy" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_categories" (
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
CREATE TABLE "inventory_items" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"category_id" text NOT NULL,
	"name" text NOT NULL,
	"sku" text,
	"unit" text DEFAULT 'piece' NOT NULL,
	"current_stock" integer DEFAULT 0 NOT NULL,
	"minimum_stock" integer DEFAULT 0 NOT NULL,
	"location" text,
	"purchase_price_in_paise" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "mess_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"monthly_fee_in_paise" integer NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"item_id" text NOT NULL,
	"transaction_type" text NOT NULL,
	"quantity" integer NOT NULL,
	"reference_number" text,
	"issued_to_membership_id" text,
	"notes" text,
	"created_by_member_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bed_allocations" ADD CONSTRAINT "bed_allocations_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed_allocations" ADD CONSTRAINT "bed_allocations_room_id_hostel_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."hostel_rooms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed_allocations" ADD CONSTRAINT "bed_allocations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_buildings" ADD CONSTRAINT "hostel_buildings_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_buildings" ADD CONSTRAINT "hostel_buildings_campus_id_campus_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campus"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_buildings" ADD CONSTRAINT "hostel_buildings_warden_membership_id_member_id_fk" FOREIGN KEY ("warden_membership_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_rooms" ADD CONSTRAINT "hostel_rooms_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_rooms" ADD CONSTRAINT "hostel_rooms_building_id_hostel_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."hostel_buildings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_categories" ADD CONSTRAINT "inventory_categories_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_category_id_inventory_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."inventory_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mess_plans" ADD CONSTRAINT "mess_plans_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_issued_to_membership_id_member_id_fk" FOREIGN KEY ("issued_to_membership_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_created_by_member_id_member_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bed_allocations_institution_idx" ON "bed_allocations" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "bed_allocations_room_idx" ON "bed_allocations" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "bed_allocations_student_idx" ON "bed_allocations" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "bed_allocations_status_idx" ON "bed_allocations" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "bed_allocations_active_student_unique_idx" ON "bed_allocations" USING btree ("student_id") WHERE "bed_allocations"."status" = 'active';--> statement-breakpoint
CREATE INDEX "hostel_buildings_institution_idx" ON "hostel_buildings" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "hostel_buildings_status_idx" ON "hostel_buildings" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "hostel_buildings_name_unique_idx" ON "hostel_buildings" USING btree ("institution_id","name") WHERE "hostel_buildings"."status" != 'deleted';--> statement-breakpoint
CREATE INDEX "hostel_rooms_institution_idx" ON "hostel_rooms" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "hostel_rooms_building_idx" ON "hostel_rooms" USING btree ("building_id");--> statement-breakpoint
CREATE INDEX "hostel_rooms_status_idx" ON "hostel_rooms" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "hostel_rooms_number_unique_idx" ON "hostel_rooms" USING btree ("building_id","room_number");--> statement-breakpoint
CREATE INDEX "inventory_categories_institution_idx" ON "inventory_categories" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "inventory_categories_status_idx" ON "inventory_categories" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_categories_name_unique_idx" ON "inventory_categories" USING btree ("institution_id","name") WHERE "inventory_categories"."status" != 'deleted';--> statement-breakpoint
CREATE INDEX "inventory_items_institution_idx" ON "inventory_items" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "inventory_items_category_idx" ON "inventory_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "inventory_items_status_idx" ON "inventory_items" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_items_sku_unique_idx" ON "inventory_items" USING btree ("institution_id","sku") WHERE "inventory_items"."sku" IS NOT NULL AND "inventory_items"."status" != 'deleted';--> statement-breakpoint
CREATE INDEX "mess_plans_institution_idx" ON "mess_plans" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "mess_plans_status_idx" ON "mess_plans" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "mess_plans_name_unique_idx" ON "mess_plans" USING btree ("institution_id","name");--> statement-breakpoint
CREATE INDEX "stock_transactions_institution_idx" ON "stock_transactions" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "stock_transactions_item_idx" ON "stock_transactions" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "stock_transactions_type_idx" ON "stock_transactions" USING btree ("transaction_type");--> statement-breakpoint
CREATE INDEX "stock_transactions_created_at_idx" ON "stock_transactions" USING btree ("created_at");
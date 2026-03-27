CREATE TABLE "student_transport_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"student_id" text NOT NULL,
	"route_id" text NOT NULL,
	"stop_id" text NOT NULL,
	"assignment_type" text DEFAULT 'both' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transport_routes" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"campus_id" text,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transport_stops" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"route_id" text NOT NULL,
	"name" text NOT NULL,
	"sequence_number" integer NOT NULL,
	"pickup_time" text,
	"drop_time" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transport_vehicles" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"registration_number" text NOT NULL,
	"type" text NOT NULL,
	"capacity" integer NOT NULL,
	"driver_name" text,
	"driver_contact" text,
	"route_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_transport_assignments" ADD CONSTRAINT "student_transport_assignments_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_transport_assignments" ADD CONSTRAINT "student_transport_assignments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_transport_assignments" ADD CONSTRAINT "student_transport_assignments_route_id_transport_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."transport_routes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_transport_assignments" ADD CONSTRAINT "student_transport_assignments_stop_id_transport_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."transport_stops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_routes" ADD CONSTRAINT "transport_routes_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_routes" ADD CONSTRAINT "transport_routes_campus_id_campus_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_stops" ADD CONSTRAINT "transport_stops_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_stops" ADD CONSTRAINT "transport_stops_route_id_transport_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."transport_routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_vehicles" ADD CONSTRAINT "transport_vehicles_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_vehicles" ADD CONSTRAINT "transport_vehicles_route_id_transport_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."transport_routes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "student_transport_institution_idx" ON "student_transport_assignments" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "student_transport_student_idx" ON "student_transport_assignments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_transport_route_idx" ON "student_transport_assignments" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "student_transport_stop_idx" ON "student_transport_assignments" USING btree ("stop_id");--> statement-breakpoint
CREATE INDEX "student_transport_status_idx" ON "student_transport_assignments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "student_transport_active_unique_idx" ON "student_transport_assignments" USING btree ("student_id") WHERE "student_transport_assignments"."status" = 'active';--> statement-breakpoint
CREATE INDEX "transport_routes_institution_idx" ON "transport_routes" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "transport_routes_campus_idx" ON "transport_routes" USING btree ("campus_id");--> statement-breakpoint
CREATE INDEX "transport_routes_status_idx" ON "transport_routes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transport_stops_institution_idx" ON "transport_stops" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "transport_stops_route_idx" ON "transport_stops" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "transport_stops_status_idx" ON "transport_stops" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "transport_stops_route_seq_unique_idx" ON "transport_stops" USING btree ("route_id","sequence_number");--> statement-breakpoint
CREATE INDEX "transport_vehicles_institution_idx" ON "transport_vehicles" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "transport_vehicles_route_idx" ON "transport_vehicles" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "transport_vehicles_status_idx" ON "transport_vehicles" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "transport_vehicles_reg_unique_idx" ON "transport_vehicles" USING btree ("institution_id","registration_number");
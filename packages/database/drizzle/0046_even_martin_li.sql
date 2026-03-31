CREATE TABLE "admission_application_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"application_id" text NOT NULL,
	"checklist_item_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"upload_url" text,
	"verified_by_member_id" text,
	"verified_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admission_document_checklists" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"document_name" text NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcement_read_receipts" (
	"announcement_id" text NOT NULL,
	"user_id" text NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "announcement_read_receipts_announcement_id_user_id_pk" PRIMARY KEY("announcement_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "homework_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"homework_id" text NOT NULL,
	"student_id" text NOT NULL,
	"status" text DEFAULT 'not_submitted' NOT NULL,
	"submitted_at" timestamp,
	"remarks" text,
	"attachment_url" text,
	"marked_by_member_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hostel_room_transfers" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"student_id" text NOT NULL,
	"from_room_id" text NOT NULL,
	"to_room_id" text NOT NULL,
	"from_bed_number" text NOT NULL,
	"to_bed_number" text NOT NULL,
	"transfer_date" date NOT NULL,
	"reason" text,
	"transferred_by_member_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_reservations" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"book_id" text NOT NULL,
	"member_id" text NOT NULL,
	"queue_position" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"fulfilled_at" timestamp,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mess_plan_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"student_id" text NOT NULL,
	"mess_plan_id" text NOT NULL,
	"bed_allocation_id" text,
	"start_date" date NOT NULL,
	"end_date" date,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"purchase_order_id" text NOT NULL,
	"item_id" text NOT NULL,
	"quantity_ordered" integer NOT NULL,
	"quantity_received" integer DEFAULT 0 NOT NULL,
	"unit_price_in_paise" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"vendor_id" text NOT NULL,
	"order_number" text NOT NULL,
	"order_date" date NOT NULL,
	"expected_delivery_date" date,
	"total_amount_in_paise" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_by_member_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_campus_transfers" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"staff_member_id" text NOT NULL,
	"from_campus_id" text NOT NULL,
	"to_campus_id" text NOT NULL,
	"transfer_date" date NOT NULL,
	"reason" text,
	"transferred_by_member_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"staff_member_id" text NOT NULL,
	"document_type" text NOT NULL,
	"document_name" text NOT NULL,
	"upload_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_disciplinary_records" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"student_id" text NOT NULL,
	"incident_date" date NOT NULL,
	"severity" text NOT NULL,
	"description" text NOT NULL,
	"action_taken" text,
	"reported_by_member_id" text NOT NULL,
	"parent_notified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_medical_records" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"student_id" text NOT NULL,
	"allergies" text,
	"conditions" text,
	"medications" text,
	"emergency_medical_info" text,
	"doctor_name" text,
	"doctor_phone" text,
	"insurance_info" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_sibling_links" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"student_id" text NOT NULL,
	"sibling_student_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfer_certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"student_id" text NOT NULL,
	"tc_number" text NOT NULL,
	"issue_date" date NOT NULL,
	"reason" text,
	"conduct_remarks" text,
	"status" text DEFAULT 'issued' NOT NULL,
	"issued_by_member_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transport_drivers" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"mobile" text NOT NULL,
	"license_number" text,
	"license_expiry" date,
	"address" text,
	"emergency_contact" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_maintenance_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"vehicle_id" text NOT NULL,
	"maintenance_type" text NOT NULL,
	"description" text NOT NULL,
	"cost_in_paise" integer,
	"maintenance_date" date NOT NULL,
	"next_due_date" date,
	"vendor_name" text,
	"created_by_member_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"contact_person" text,
	"phone" text,
	"email" text,
	"address" text,
	"gst_number" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admission_applications" ADD COLUMN "registration_fee_amount_in_paise" integer;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD COLUMN "registration_fee_paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD COLUMN "waitlist_position" integer;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD COLUMN "converted_student_id" text;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "scheduled_publish_at" timestamp;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "target_class_id" text;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "target_section_id" text;--> statement-breakpoint
ALTER TABLE "homework" ADD COLUMN "parent_visible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "homework" ADD COLUMN "attachment_url" text;--> statement-breakpoint
ALTER TABLE "staff_profiles" ADD COLUMN "reporting_to_member_id" text;--> statement-breakpoint
ALTER TABLE "staff_profiles" ADD COLUMN "emergency_contact_relation" text;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD COLUMN "department_name" text;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD COLUMN "purchase_order_id" text;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD COLUMN "unit_price_in_paise" integer;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "previous_school_name" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "previous_school_board" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "previous_school_class" text;--> statement-breakpoint
ALTER TABLE "transport_vehicles" ADD COLUMN "driver_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "communication_preference" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "occupation" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "annual_income_range" text;--> statement-breakpoint
ALTER TABLE "admission_application_documents" ADD CONSTRAINT "admission_application_documents_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_application_documents" ADD CONSTRAINT "admission_application_documents_application_id_admission_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."admission_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_application_documents" ADD CONSTRAINT "admission_application_documents_checklist_item_id_admission_document_checklists_id_fk" FOREIGN KEY ("checklist_item_id") REFERENCES "public"."admission_document_checklists"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_application_documents" ADD CONSTRAINT "admission_application_documents_verified_by_member_id_member_id_fk" FOREIGN KEY ("verified_by_member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_document_checklists" ADD CONSTRAINT "admission_document_checklists_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_read_receipts" ADD CONSTRAINT "announcement_read_receipts_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_read_receipts" ADD CONSTRAINT "announcement_read_receipts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_homework_id_homework_id_fk" FOREIGN KEY ("homework_id") REFERENCES "public"."homework"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_marked_by_member_id_member_id_fk" FOREIGN KEY ("marked_by_member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_room_transfers" ADD CONSTRAINT "hostel_room_transfers_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_room_transfers" ADD CONSTRAINT "hostel_room_transfers_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_room_transfers" ADD CONSTRAINT "hostel_room_transfers_from_room_id_hostel_rooms_id_fk" FOREIGN KEY ("from_room_id") REFERENCES "public"."hostel_rooms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_room_transfers" ADD CONSTRAINT "hostel_room_transfers_to_room_id_hostel_rooms_id_fk" FOREIGN KEY ("to_room_id") REFERENCES "public"."hostel_rooms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_room_transfers" ADD CONSTRAINT "hostel_room_transfers_transferred_by_member_id_member_id_fk" FOREIGN KEY ("transferred_by_member_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_reservations" ADD CONSTRAINT "library_reservations_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_reservations" ADD CONSTRAINT "library_reservations_book_id_library_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."library_books"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_reservations" ADD CONSTRAINT "library_reservations_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mess_plan_assignments" ADD CONSTRAINT "mess_plan_assignments_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mess_plan_assignments" ADD CONSTRAINT "mess_plan_assignments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mess_plan_assignments" ADD CONSTRAINT "mess_plan_assignments_mess_plan_id_mess_plans_id_fk" FOREIGN KEY ("mess_plan_id") REFERENCES "public"."mess_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mess_plan_assignments" ADD CONSTRAINT "mess_plan_assignments_bed_allocation_id_bed_allocations_id_fk" FOREIGN KEY ("bed_allocation_id") REFERENCES "public"."bed_allocations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_member_id_member_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_campus_transfers" ADD CONSTRAINT "staff_campus_transfers_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_campus_transfers" ADD CONSTRAINT "staff_campus_transfers_staff_member_id_member_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_campus_transfers" ADD CONSTRAINT "staff_campus_transfers_from_campus_id_campus_id_fk" FOREIGN KEY ("from_campus_id") REFERENCES "public"."campus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_campus_transfers" ADD CONSTRAINT "staff_campus_transfers_to_campus_id_campus_id_fk" FOREIGN KEY ("to_campus_id") REFERENCES "public"."campus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_campus_transfers" ADD CONSTRAINT "staff_campus_transfers_transferred_by_member_id_member_id_fk" FOREIGN KEY ("transferred_by_member_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_documents" ADD CONSTRAINT "staff_documents_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_documents" ADD CONSTRAINT "staff_documents_staff_member_id_member_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_disciplinary_records" ADD CONSTRAINT "student_disciplinary_records_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_disciplinary_records" ADD CONSTRAINT "student_disciplinary_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_disciplinary_records" ADD CONSTRAINT "student_disciplinary_records_reported_by_member_id_member_id_fk" FOREIGN KEY ("reported_by_member_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_medical_records" ADD CONSTRAINT "student_medical_records_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_medical_records" ADD CONSTRAINT "student_medical_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_sibling_links" ADD CONSTRAINT "student_sibling_links_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_sibling_links" ADD CONSTRAINT "student_sibling_links_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_sibling_links" ADD CONSTRAINT "student_sibling_links_sibling_student_id_students_id_fk" FOREIGN KEY ("sibling_student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_certificates" ADD CONSTRAINT "transfer_certificates_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_certificates" ADD CONSTRAINT "transfer_certificates_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_certificates" ADD CONSTRAINT "transfer_certificates_issued_by_member_id_member_id_fk" FOREIGN KEY ("issued_by_member_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_drivers" ADD CONSTRAINT "transport_drivers_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_maintenance_logs" ADD CONSTRAINT "vehicle_maintenance_logs_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_maintenance_logs" ADD CONSTRAINT "vehicle_maintenance_logs_vehicle_id_transport_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."transport_vehicles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_maintenance_logs" ADD CONSTRAINT "vehicle_maintenance_logs_created_by_member_id_member_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admission_app_docs_institution_idx" ON "admission_application_documents" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "admission_app_docs_application_idx" ON "admission_application_documents" USING btree ("application_id");--> statement-breakpoint
CREATE UNIQUE INDEX "admission_app_docs_unique_idx" ON "admission_application_documents" USING btree ("application_id","checklist_item_id");--> statement-breakpoint
CREATE INDEX "admission_doc_checklists_institution_idx" ON "admission_document_checklists" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "announcement_read_receipts_user_idx" ON "announcement_read_receipts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "homework_submissions_institution_idx" ON "homework_submissions" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "homework_submissions_homework_idx" ON "homework_submissions" USING btree ("homework_id");--> statement-breakpoint
CREATE INDEX "homework_submissions_student_idx" ON "homework_submissions" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "homework_submissions_unique_idx" ON "homework_submissions" USING btree ("homework_id","student_id");--> statement-breakpoint
CREATE INDEX "hostel_room_transfers_institution_idx" ON "hostel_room_transfers" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "hostel_room_transfers_student_idx" ON "hostel_room_transfers" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "hostel_room_transfers_date_idx" ON "hostel_room_transfers" USING btree ("transfer_date");--> statement-breakpoint
CREATE INDEX "library_reservations_institution_idx" ON "library_reservations" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "library_reservations_book_idx" ON "library_reservations" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "library_reservations_member_idx" ON "library_reservations" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "library_reservations_status_idx" ON "library_reservations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mess_plan_assignments_institution_idx" ON "mess_plan_assignments" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "mess_plan_assignments_student_idx" ON "mess_plan_assignments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "mess_plan_assignments_plan_idx" ON "mess_plan_assignments" USING btree ("mess_plan_id");--> statement-breakpoint
CREATE INDEX "mess_plan_assignments_status_idx" ON "mess_plan_assignments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "mess_plan_assignments_active_student_unique_idx" ON "mess_plan_assignments" USING btree ("student_id") WHERE "mess_plan_assignments"."status" = 'active';--> statement-breakpoint
CREATE INDEX "purchase_order_items_order_idx" ON "purchase_order_items" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "purchase_order_items_item_idx" ON "purchase_order_items" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "purchase_orders_institution_idx" ON "purchase_orders" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "purchase_orders_vendor_idx" ON "purchase_orders" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_orders_number_unique_idx" ON "purchase_orders" USING btree ("institution_id","order_number");--> statement-breakpoint
CREATE INDEX "staff_campus_transfers_institution_idx" ON "staff_campus_transfers" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "staff_campus_transfers_staff_idx" ON "staff_campus_transfers" USING btree ("staff_member_id");--> statement-breakpoint
CREATE INDEX "staff_campus_transfers_date_idx" ON "staff_campus_transfers" USING btree ("transfer_date");--> statement-breakpoint
CREATE INDEX "staff_documents_institution_idx" ON "staff_documents" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "staff_documents_staff_idx" ON "staff_documents" USING btree ("staff_member_id");--> statement-breakpoint
CREATE INDEX "student_disciplinary_institution_idx" ON "student_disciplinary_records" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "student_disciplinary_student_idx" ON "student_disciplinary_records" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_disciplinary_date_idx" ON "student_disciplinary_records" USING btree ("incident_date");--> statement-breakpoint
CREATE INDEX "student_medical_records_institution_idx" ON "student_medical_records" USING btree ("institution_id");--> statement-breakpoint
CREATE UNIQUE INDEX "student_medical_records_student_unique_idx" ON "student_medical_records" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_sibling_links_institution_idx" ON "student_sibling_links" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "student_sibling_links_student_idx" ON "student_sibling_links" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "student_sibling_links_unique_idx" ON "student_sibling_links" USING btree ("student_id","sibling_student_id");--> statement-breakpoint
CREATE INDEX "transfer_certificates_institution_idx" ON "transfer_certificates" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "transfer_certificates_student_idx" ON "transfer_certificates" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transfer_certificates_number_unique_idx" ON "transfer_certificates" USING btree ("institution_id","tc_number");--> statement-breakpoint
CREATE INDEX "transport_drivers_institution_idx" ON "transport_drivers" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "transport_drivers_status_idx" ON "transport_drivers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vehicle_maintenance_institution_idx" ON "vehicle_maintenance_logs" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "vehicle_maintenance_vehicle_idx" ON "vehicle_maintenance_logs" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "vehicle_maintenance_date_idx" ON "vehicle_maintenance_logs" USING btree ("maintenance_date");--> statement-breakpoint
CREATE INDEX "vendors_institution_idx" ON "vendors" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "vendors_status_idx" ON "vendors" USING btree ("status");--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_converted_student_id_students_id_fk" FOREIGN KEY ("converted_student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_target_class_id_classes_id_fk" FOREIGN KEY ("target_class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_target_section_id_sections_id_fk" FOREIGN KEY ("target_section_id") REFERENCES "public"."sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_reporting_to_member_id_member_id_fk" FOREIGN KEY ("reporting_to_member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "announcements_category_idx" ON "announcements" USING btree ("category");
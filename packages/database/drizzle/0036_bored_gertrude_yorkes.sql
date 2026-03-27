CREATE TABLE "library_books" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"isbn" text,
	"publisher" text,
	"genre" text,
	"total_copies" integer DEFAULT 1 NOT NULL,
	"available_copies" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"book_id" text NOT NULL,
	"member_id" text NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"due_date" date NOT NULL,
	"returned_at" timestamp,
	"fine_amount" integer DEFAULT 0 NOT NULL,
	"fine_paid" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'issued' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "library_books" ADD CONSTRAINT "library_books_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_transactions" ADD CONSTRAINT "library_transactions_institution_id_organization_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_transactions" ADD CONSTRAINT "library_transactions_book_id_library_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."library_books"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_transactions" ADD CONSTRAINT "library_transactions_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "library_books_institution_idx" ON "library_books" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "library_books_status_idx" ON "library_books" USING btree ("status");--> statement-breakpoint
CREATE INDEX "library_transactions_institution_idx" ON "library_transactions" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "library_transactions_book_idx" ON "library_transactions" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "library_transactions_member_idx" ON "library_transactions" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "library_transactions_status_idx" ON "library_transactions" USING btree ("status");
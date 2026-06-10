ALTER TABLE "user" ADD COLUMN "is_approved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "waitlist_consent" boolean DEFAULT false NOT NULL;
ALTER TABLE "user" ALTER COLUMN "jobs_opened" SET DATA TYPE integer[];--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "jobs_opened" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "jobs_opened" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "scraped_jobs" ADD COLUMN "contact_details" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "roles" text DEFAULT 'student' NOT NULL;
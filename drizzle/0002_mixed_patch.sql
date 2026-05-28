ALTER TABLE "scraped_jobs" ADD COLUMN "company_rating" real;--> statement-breakpoint
ALTER TABLE "scraped_jobs" ADD COLUMN "glassdoor_rating" real;--> statement-breakpoint
ALTER TABLE "scraped_jobs" ADD COLUMN "ambitionbox_rating" real;--> statement-breakpoint
ALTER TABLE "scraped_jobs" ADD COLUMN "show_to_students" boolean DEFAULT true;
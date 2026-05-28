CREATE TABLE "scraped_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"company" text,
	"location" text,
	"link" text,
	"posted" text,
	"posted_datetime" timestamp,
	"programs" jsonb DEFAULT '[]'::jsonb,
	"schools" jsonb DEFAULT '[]'::jsonb,
	"scraped_at" timestamp DEFAULT now(),
	"keywords" text,
	"freshness" text,
	"work_types" jsonb DEFAULT '[]'::jsonb,
	"job_types" jsonb DEFAULT '[]'::jsonb,
	CONSTRAINT "scraped_jobs_link_unique" UNIQUE("link")
);
--> statement-breakpoint
CREATE INDEX "idx_scraped_at" ON "scraped_jobs" USING btree ("scraped_at");--> statement-breakpoint
CREATE INDEX "idx_link" ON "scraped_jobs" USING btree ("link");
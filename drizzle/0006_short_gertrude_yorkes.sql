ALTER TABLE "user" ALTER COLUMN "jobs_opened" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "jobs_opened" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "jobs_opened" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "roles";
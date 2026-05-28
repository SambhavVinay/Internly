import {
  and,
  desc,
  getTableColumns,
  gte,
  lt,
  lte,
  sql,
  type SQL,
} from "drizzle-orm";

import { db } from "./index";
import { scrapedJobs } from "./schema";

// ── Types ─────────────────────────────────────────────────────────────────

/**
 * A row as it lives in the database. Inferred straight from the schema, so
 * camelCase keys (`postedDatetime`, `scrapedAt`) and real `Date` objects
 * for timestamps. Use this when you're working with Drizzle results
 * directly.
 */
export type ScrapedJob = typeof scrapedJobs.$inferSelect;

/**
 * A row in the shape accepted by `db.insert(scrapedJobs).values(...)`.
 * Columns with defaults (`id`, `scrapedAt`, the `jsonb` arrays) become
 * optional automatically.
 */
export type NewScrapedJob = typeof scrapedJobs.$inferInsert;

/**
 * Wire-format job — the JSON shape the Python scraper emits and the
 * existing React components consume. Snake_case keys and ISO-8601 strings
 * for timestamps, so it survives a `JSON.stringify` round trip.
 */
export interface JobPayload {
  title?: string | null;
  company?: string | null;
  location?: string | null;
  link?: string | null;
  posted?: string | null;
  posted_datetime?: string | null;
  programs?: string[];
  schools?: string[];
  scraped_at?: string | null;
  keywords?: string | null;
  company_rating?: number | null;
}

/**
 * The search filters that were active when a batch of jobs was scraped.
 * Stored alongside each row so we can later answer "which jobs came from
 * which query".
 */
export interface SearchParams {
  keywords?: string | null;
  freshness?: string | null;
  work_types?: string[];
  job_types?: string[];
}

// ── Internal helpers ──────────────────────────────────────────────────────

/**
 * Best-effort conversion of a "5 hours ago"-style label into an absolute
 * `Date`. If `postedDatetimeStr` is already a full ISO timestamp we trust
 * it; if it's missing or just a bare `YYYY-MM-DD` date, we derive the
 * timestamp from the relative `posted` label. Falls back to `now` when
 * neither source is usable.
 *
 * Kept private to this module — it only exists to match the normalization
 * that `database.save_scraped_jobs` was doing in Python.
 */
function computePostedDatetime(
  posted: string,
  postedDatetimeStr: string | null | undefined,
  now: Date,
): Date {
  const needsRecompute =
    !postedDatetimeStr ||
    (typeof postedDatetimeStr === "string" && postedDatetimeStr.length <= 10);

  if (posted && needsRecompute) {
    const lower = posted.toLowerCase();
    const match = lower.match(/(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      const MIN = 60 * 1000;
      const HOUR = 60 * MIN;
      const DAY = 24 * HOUR;

      let deltaMs: number | null = null;
      if (lower.includes("minute")) deltaMs = n * MIN;
      else if (lower.includes("hour")) deltaMs = n * HOUR;
      else if (lower.includes("day")) deltaMs = n * DAY;
      else if (lower.includes("week")) deltaMs = n * 7 * DAY;
      else if (lower.includes("month")) deltaMs = n * 30 * DAY;

      if (deltaMs !== null) return new Date(now.getTime() - deltaMs);
      return now;
    }
  }

  if (postedDatetimeStr) {
    const parsed = new Date(postedDatetimeStr);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return now;
}

/**
 * Build the `set: { ... }` clause for `ON CONFLICT DO UPDATE` that copies
 * every listed column from the proposed row (`EXCLUDED.<col>`). Lets us
 * say "on conflict, overwrite these columns with the new values" without
 * hand-listing each column twice.
 */
function excludedSet<
  TCols extends readonly (keyof typeof scrapedJobs._.columns)[],
>(cols: TCols): Record<TCols[number], SQL> {
  const tableCols = getTableColumns(scrapedJobs);
  const out = {} as Record<TCols[number], SQL>;
  for (const key of cols) {
    const dbName = tableCols[key as keyof typeof tableCols].name;
    out[key as TCols[number]] = sql.raw(`excluded."${dbName}"`);
  }
  return out;
}

/**
 * Convert a Drizzle row into the wire-format `JobPayload` that callers
 * (the FastAPI scraper and the React UI) expect. Centralizes the
 * snake_case re-keying and the `Date -> ISO string` conversion.
 */
function rowToPayload(row: ScrapedJob): JobPayload {
  return {
    title: row.title,
    company: row.company,
    location: row.location,
    link: row.link,
    posted: row.posted,
    posted_datetime: row.postedDatetime ? row.postedDatetime.toISOString() : null,
    programs: row.programs ?? [],
    schools: row.schools ?? [],
    scraped_at: row.scrapedAt ? row.scrapedAt.toISOString() : null,
    keywords: row.keywords,
    company_rating: row.companyRating,
  };
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Upsert a batch of scraped jobs.
 *
 * The `link` column has a UNIQUE constraint, so re-scraping a listing
 * doesn't create duplicates — instead, the existing row is updated in
 * place with the freshest title / company / location / metadata. New
 * links produce new rows.
 *
 * Implementation notes:
 *  - Runs as a single `INSERT ... ON CONFLICT DO UPDATE` so the whole
 *    batch is one round-trip to Postgres.
 *  - `posted_datetime` is normalized via {@link computePostedDatetime},
 *    so relative labels like "3 hours ago" land in the DB as real
 *    timestamps that you can range-query.
 *  - Returns the count of affected rows (inserted + updated) using
 *    `RETURNING id`, which Postgres emits for both branches of the
 *    upsert.
 *
 * Drizzle replacement for `database.save_scraped_jobs`.
 */
export async function saveScrapedJobs(
  jobs: JobPayload[],
  params: SearchParams,
): Promise<number> {
  if (jobs.length === 0) return 0;

  const now = new Date();

  const values: NewScrapedJob[] = jobs.map((job) => {
    const posted = job.posted ?? "";
    return {
      title: job.title ?? null,
      company: job.company ?? null,
      location: job.location ?? null,
      link: job.link ?? null,
      posted,
      postedDatetime: computePostedDatetime(posted, job.posted_datetime, now),
      programs: job.programs ?? [],
      schools: job.schools ?? [],
      keywords: params.keywords ?? null,
      freshness: params.freshness ?? null,
      workTypes: params.work_types ?? [],
      jobTypes: params.job_types ?? [],
      scrapedAt: now,
    };
  });

  const result = await db
    .insert(scrapedJobs)
    .values(values)
    .onConflictDoUpdate({
      target: scrapedJobs.link,
      set: excludedSet([
        "title",
        "company",
        "location",
        "posted",
        "postedDatetime",
        "programs",
        "schools",
        "keywords",
        "freshness",
        "workTypes",
        "jobTypes",
        "scrapedAt",
      ]),
    })
    .returning({ id: scrapedJobs.id });

  return result.length;
}

/**
 * Fetch every job whose `posted_datetime` is within the last `hoursAgo`
 * hours, newest first.
 *
 * Example: `getJobsByTimeframe(24)` returns everything posted in the last
 * day.
 *
 * Drizzle replacement for `database.get_jobs_by_timeframe`.
 */
export async function getJobsByTimeframe(
  hoursAgo: number,
): Promise<JobPayload[]> {
  const threshold = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  const rows = await db
    .select()
    .from(scrapedJobs)
    .where(gte(scrapedJobs.postedDatetime, threshold))
    .orderBy(desc(scrapedJobs.postedDatetime));

  return rows.map(rowToPayload);
}

/**
 * Fetch jobs whose `posted_datetime` falls inside the window
 * `[now - startHours, now - endHours]`, newest first.
 *
 * The argument order matches the legacy Python signature on purpose:
 * `startHours` is the OLDER bound and `endHours` is the NEWER bound. So
 * `getJobsInTimeframe(24, 5)` means "jobs between 24h ago and 5h ago" —
 * which is how the student dashboard buckets its rows.
 *
 * Drizzle replacement for `database.get_jobs_in_timeframe`.
 */
export async function getJobsInTimeframe(
  startHours: number,
  endHours: number,
): Promise<JobPayload[]> {
  const now = Date.now();
  const start = new Date(now - startHours * 60 * 60 * 1000);
  const end = new Date(now - endHours * 60 * 60 * 1000);

  const rows = await db
    .select()
    .from(scrapedJobs)
    .where(
      and(
        gte(scrapedJobs.postedDatetime, start),
        lte(scrapedJobs.postedDatetime, end),
      ),
    )
    .orderBy(desc(scrapedJobs.postedDatetime));

  return rows.map(rowToPayload);
}

/**
 * Delete every job whose `posted_datetime` is older than `daysOld` days
 * and return how many rows were removed.
 *
 * Uses `DELETE ... RETURNING id` so the count is exact instead of relying
 * on driver-specific affected-row counters.
 *
 * Drizzle replacement for `database.cleanup_old_jobs`.
 */
export async function cleanupOldJobs(daysOld = 7): Promise<number> {
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

  const deleted = await db
    .delete(scrapedJobs)
    .where(lt(scrapedJobs.postedDatetime, cutoff))
    .returning({ id: scrapedJobs.id });

  return deleted.length;
}

/**
 * Fetch jobs from the last 30 days in one query and bin them by timeframe.
 * Matches the logic in the Python backend database.py.
 */
export async function getBinnedJobs(): Promise<Record<string, { jobs: JobPayload[]; count: number }>> {
  const now = new Date();
  const threshold = new Date(now.getTime() - 720 * 60 * 60 * 1000); // 720 hours = 30 days

  const rows = await db
    .select()
    .from(scrapedJobs)
    .where(gte(scrapedJobs.postedDatetime, threshold))
    .orderBy(desc(scrapedJobs.postedDatetime));

  const t_1: JobPayload[] = [];
  const t_2: JobPayload[] = [];
  const t_5: JobPayload[] = [];
  const t_24: JobPayload[] = [];
  const t_168: JobPayload[] = [];
  const t_720: JobPayload[] = [];

  for (const row of rows) {
    if (!row.postedDatetime) continue;
    const job = rowToPayload(row);
    const hours = (now.getTime() - row.postedDatetime.getTime()) / (60 * 60 * 1000);

    if (hours <= 1) {
      t_1.push(job);
    } else if (hours <= 2) {
      t_2.push(job);
    } else if (hours <= 5) {
      t_5.push(job);
    } else if (hours <= 24) {
      t_24.push(job);
    } else if (hours <= 168) {
      t_168.push(job);
    } else if (hours <= 720) {
      t_720.push(job);
    }
  }

  return {
    "1_hour": { jobs: t_1, count: t_1.length },
    "2_hours": { jobs: t_2, count: t_2.length },
    "5_hours": { jobs: t_5, count: t_5.length },
    "24_hours": { jobs: t_24, count: t_24.length },
    "1_week": { jobs: t_168, count: t_168.length },
    "1_month": { jobs: t_720, count: t_720.length },
  };
}


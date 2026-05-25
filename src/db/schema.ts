import {
  boolean,
  index,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// ── Scraped jobs (existing) ─────────────────────────────────────────────────

export const scrapedJobs = pgTable(
  "scraped_jobs",
  {
    id: serial("id").primaryKey(),

    title: text("title"),

    company: text("company"),

    location: text("location"),

    link: text("link").unique(),

    posted: text("posted"),

    postedDatetime: timestamp("posted_datetime"),

    programs: jsonb("programs")
      .$type<string[]>()
      .default([]),

    schools: jsonb("schools")
      .$type<string[]>()
      .default([]),

    scrapedAt: timestamp("scraped_at")
      .defaultNow(),

    keywords: text("keywords"),

    freshness: text("freshness"),

    workTypes: jsonb("work_types")
      .$type<string[]>()
      .default([]),

    jobTypes: jsonb("job_types")
      .$type<string[]>()
      .default([]),
  },
  (table) => ({
    scrapedAtIdx: index("idx_scraped_at")
      .on(table.scrapedAt),

    linkIdx: index("idx_link")
      .on(table.link),
  })
);

// ── Better Auth tables ──────────────────────────────────────────────────────
// Field NAMES (the JS keys) must match Better Auth's internal field names
// (camelCase) so the Drizzle adapter can resolve them. The SQL column names
// stay snake_case via the column builder's first argument.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  providerId: text("provider_id").notNull(),
  accountId: text("account_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

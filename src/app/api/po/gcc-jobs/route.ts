import { NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location"); // 'bangalore' | null
  const q = searchParams.get("q");
  const rating = searchParams.get("rating");

  let query: string;
  let params: string[] = [];

  let conditions = [];
  
  if (location?.toLowerCase() === "bangalore") {
    conditions.push(`(LOWER(location) LIKE '%bangalore%' OR LOWER(location) LIKE '%bengaluru%')`);
  }
  
  if (q) {
    conditions.push(`search_vector @@ websearch_to_tsquery('english', $1)`);
    params.push(q);
  }
  
  if (rating) {
    if (rating === "0-1") conditions.push(`company_rating <= 1.99`);
    else if (rating === "2-3") conditions.push(`company_rating >= 2 AND company_rating < 3`);
    else if (rating === "3-4") conditions.push(`company_rating >= 3 AND company_rating < 4`);
    else if (rating === "4-5") conditions.push(`company_rating >= 4 AND company_rating <= 5`);
  }

  let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : "";

  query = `
    SELECT id, title, company, location, link, posted, posted_datetime,
           experience_level, company_rating, contact_details, scraped_at
    FROM gcc_jobs
    ${whereClause}
    ORDER BY scraped_at DESC
  `;

  try {
    const { rows } = await pool.query(query, params);

    const jobs = rows.map((row, i) => ({
      id:              row.id ?? i + 2000000,
      title:           row.title,
      company:         row.company,
      location:        row.location,
      link:            row.link,
      posted:          row.posted,
      posted_datetime: row.posted_datetime ? new Date(row.posted_datetime).toISOString() : null,
      programs:        ["GCC"],
      schools:         [],
      source:          "GCC Hunt",
      company_rating:  row.company_rating ?? null,
      contact_details: row.contact_details ?? [],
    }));

    return NextResponse.json({ jobs, count: jobs.length });
  } catch (error: any) {
    // gcc_jobs table might not exist yet (script hasn't run)
    if (error?.code === "42P01") {
      return NextResponse.json(
        { error: "GCC jobs table not found. Run enrich_gcc_jobs.py first.", jobs: [], count: 0 },
        { status: 503 }
      );
    }
    console.error("gcc-jobs route error:", error);
    return NextResponse.json(
      { error: "Failed to load GCC jobs" },
      { status: 500 }
    );
  }
}

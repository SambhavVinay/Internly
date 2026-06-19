import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const jobsFilePath = "C:\\Users\\Sambhav\\Desktop\\gcc-hunt\\web\\src\\data\\jobs.json";
    const rawData = await fs.readFile(jobsFilePath, "utf8");
    const gccJobs = JSON.parse(rawData);

    // Take the top 100 jobs to avoid sending a massive payload
    const topJobs = gccJobs.slice(0, 100);

    // Map to InternScrapper Job interface
    const mappedJobs = topJobs.map((job: any, index: number) => ({
      id: index + 1000000, // Generate a unique ID
      title: job.title || null,
      company: job.companyName || job.companyId || job.company || "Unknown Company",
      location: job.location || job.city || "Unknown Location",
      link: job.url || job.applyUrl || null,
      posted: job.postedDate || job.createdAt || new Date().toISOString(),
      posted_datetime: job.postedDate || job.createdAt || new Date().toISOString(),
      programs: ["GCC"],
      schools: [], // Not school specific
      source: "GCC Hunt",
      company_rating: null,
    }));

    return NextResponse.json({
      jobs: mappedJobs,
      count: mappedJobs.length,
      totalCount: gccJobs.length
    });
  } catch (error) {
    console.error("Failed to read GCC jobs:", error);
    return NextResponse.json({ error: "Failed to load GCC jobs" }, { status: 500 });
  }
}

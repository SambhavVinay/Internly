import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await req.json();
    if (!jobId || typeof jobId !== "number") {
      return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
    }

    // Update the user's jobsOpened array in DB by appending jobId
    await db
      .update(user)
      .set({
        jobsOpened: sql`array_append(coalesce(jobs_opened, '{}'::integer[]), ${jobId})`,
      })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to record job open action:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

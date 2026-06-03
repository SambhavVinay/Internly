import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { cleanupOldJobs, getBinnedJobs } from "@/db/queries";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const data = await getBinnedJobs();
    // Fire-and-forget style: don't block the response on cleanup.
    cleanupOldJobs(30).catch(() => {});

    // Try to get user session and jobsOpened
    let jobsOpened: number[] = [];
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (session?.user) {
        const u = await db
          .select({ jobsOpened: user.jobsOpened })
          .from(user)
          .where(eq(user.id, session.user.id))
          .limit(1);
        if (u.length > 0) {
          jobsOpened = u[0].jobsOpened || [];
        }
      }
    } catch (sessionErr) {
      console.error("Failed to get session or jobsOpened in API:", sessionErr);
    }

    return NextResponse.json(
      {
        ...data,
        jobsOpened,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load student jobs";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}

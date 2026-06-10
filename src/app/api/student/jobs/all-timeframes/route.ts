import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { cleanupOldJobs, getBinnedJobs } from "@/db/queries";

export async function GET() {
  try {
    const data = await getBinnedJobs();
    
    // Check if user is logged in to fetch their opened jobs list
    let openedJobIds: number[] = [];
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (session?.user) {
        const isApproved = (session.user as any).isApproved as boolean | undefined;
        if (!isApproved) {
          const { isEmailInAllowlist } = await import("@/lib/allowlist");
          if (isEmailInAllowlist(session.user.email)) {
            await db
              .update(user)
              .set({ isApproved: true })
              .where(eq(user.id, session.user.id));
          } else {
            return NextResponse.json({ error: "Access pending approval" }, { status: 403 });
          }
        }

        const rows = await db
          .select({ jobsOpened: user.jobsOpened })
          .from(user)
          .where(eq(user.id, session.user.id))
          .limit(1);
        openedJobIds = rows[0]?.jobsOpened || [];
      }
    } catch (sessionErr) {
      console.error("Failed to fetch session or opened jobs:", sessionErr);
    }

    // Fire-and-forget style: don't block the response on cleanup.
    cleanupOldJobs(30).catch(() => {});
    
    return NextResponse.json({
      ...data,
      openedJobIds,
    }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load student jobs";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

import { cleanupOldJobs, getBinnedJobs } from "@/db/queries";

export async function GET() {
  try {
    const data = await getBinnedJobs();
    // Fire-and-forget style: don't block the response on cleanup.
    cleanupOldJobs(30).catch(() => {});
    return NextResponse.json(data, {
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

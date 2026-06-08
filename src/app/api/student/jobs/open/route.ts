import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await request.json();
    if (typeof jobId !== "number") {
      return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
    }

    const userId = session.user.id;

    // Fetch the current jobs_opened array
    const rows = await db
      .select({ jobsOpened: user.jobsOpened })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    const currentOpened = rows[0]?.jobsOpened || [];

    // Append the jobId if it's not already in the array
    if (!currentOpened.includes(jobId)) {
      const updatedOpened = [...currentOpened, jobId];
      await db
        .update(user)
        .set({ jobsOpened: updatedOpened })
        .where(eq(user.id, userId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to record opened job:", error);
    return NextResponse.json(
      { error: "Failed to record opened job" },
      { status: 500 }
    );
  }
}

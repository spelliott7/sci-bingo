import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCompletedRunsForUser } from "@/lib/historyQueries";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const data = await getCompletedRunsForUser(session.sub);
  return NextResponse.json(data);
}

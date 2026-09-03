import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getRunHistoryDetail } from "@/lib/historyQueries";

export async function GET(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const data = await getRunHistoryDetail(runId, session.sub);
  if (!data) {
    return NextResponse.json({ error: "Run not found." }, { status: 404 });
  }

  return NextResponse.json(data);
}

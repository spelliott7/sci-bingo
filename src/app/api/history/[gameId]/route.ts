import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getGameHistoryDetail } from "@/lib/historyQueries";

export async function GET(_request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const data = await getGameHistoryDetail(gameId, session.sub);
  if (!data) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }

  return NextResponse.json(data);
}

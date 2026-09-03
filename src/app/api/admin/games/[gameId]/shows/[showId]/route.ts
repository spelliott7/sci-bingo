import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ gameId: string; showId: string }> },
) {
  const { gameId, showId } = await params;
  await prisma.gameShow.delete({ where: { gameId_showId: { gameId, showId } } }).catch(() => null);
  return NextResponse.json({ ok: true });
}

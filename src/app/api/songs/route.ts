import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const songs = await prisma.song.findMany({
    select: { id: true, name: true, isCover: true, playCount: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ songs });
}

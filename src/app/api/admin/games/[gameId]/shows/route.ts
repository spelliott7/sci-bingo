import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const gameShows = await prisma.gameShow.findMany({
    where: { gameId },
    include: { show: { include: { _count: { select: { playedSongs: true } } } } },
    orderBy: { show: { showDate: "asc" } },
  });
  const shows = gameShows.map((gs) => ({
    id: gs.show.id,
    name: gs.show.name,
    venue: gs.show.venue,
    showDate: gs.show.showDate,
    _count: gs.show._count,
  }));
  return NextResponse.json({ shows });
}

// Attach an existing show (by id) or create a brand new one and attach it.
const schema = z.union([
  z.object({ showId: z.string().min(1) }),
  z.object({
    name: z.string().trim().max(120).optional().or(z.literal("")),
    venue: z.string().trim().max(160).optional().or(z.literal("")),
    showDate: z.string().min(1, "Pick a show date."),
  }),
]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid show." },
      { status: 400 },
    );
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }

  let showId: string;
  if ("showId" in parsed.data) {
    const show = await prisma.show.findUnique({ where: { id: parsed.data.showId } });
    if (!show) {
      return NextResponse.json({ error: "Show not found." }, { status: 404 });
    }
    showId = show.id;
  } else {
    const showDate = new Date(parsed.data.showDate);
    if (Number.isNaN(showDate.getTime())) {
      return NextResponse.json({ error: "That show date isn't valid." }, { status: 400 });
    }
    const show = await prisma.show.create({
      data: {
        name: parsed.data.name || null,
        venue: parsed.data.venue || null,
        showDate,
      },
    });
    showId = show.id;
  }

  const alreadyAttached = await prisma.gameShow.findUnique({
    where: { gameId_showId: { gameId: game.id, showId } },
  });
  if (alreadyAttached) {
    return NextResponse.json({ error: "That show is already part of this game." }, { status: 409 });
  }

  await prisma.gameShow.create({ data: { gameId: game.id, showId } });

  const show = await prisma.show.findUnique({ where: { id: showId } });
  return NextResponse.json({ show });
}

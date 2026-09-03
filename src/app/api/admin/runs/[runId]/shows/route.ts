import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const shows = await prisma.show.findMany({
    where: { runId },
    orderBy: { showDate: "asc" },
    include: { _count: { select: { playedSongs: true } } },
  });
  return NextResponse.json({ shows });
}

const schema = z.object({
  name: z.string().trim().max(120).optional().or(z.literal("")),
  venue: z.string().trim().max(160).optional().or(z.literal("")),
  showDate: z.string().min(1, "Pick a show date."),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid show." },
      { status: 400 },
    );
  }

  const run = await prisma.run.findUnique({ where: { id: runId } });
  if (!run) {
    return NextResponse.json({ error: "Run not found." }, { status: 404 });
  }

  const showDate = new Date(parsed.data.showDate);
  if (Number.isNaN(showDate.getTime())) {
    return NextResponse.json({ error: "That show date isn't valid." }, { status: 400 });
  }

  const show = await prisma.show.create({
    data: {
      runId: run.id,
      name: parsed.data.name || null,
      venue: parsed.data.venue || null,
      showDate,
    },
  });

  return NextResponse.json({ show });
}

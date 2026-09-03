import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export async function GET() {
  const runs = await prisma.run.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { cards: true, shows: true } } },
  });
  return NextResponse.json({ runs });
}

const schema = z.object({
  name: z.string().trim().min(1, "Give the run a name.").max(120),
  entryFee: z.number().positive().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid run." },
      { status: 400 },
    );
  }

  const run = await prisma.run.create({
    data: {
      name: parsed.data.name,
      entryFee: parsed.data.entryFee ?? 10,
    },
  });

  return NextResponse.json({ run });
}

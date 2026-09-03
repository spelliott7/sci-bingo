import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const run = await prisma.run.findUnique({ where: { id: runId } });
  if (!run) {
    return NextResponse.json({ error: "Run not found." }, { status: 404 });
  }
  return NextResponse.json({ run });
}

const schema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED"]).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  winnerCardId: z.string().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  const rawBody = await request.json().catch(() => null);
  const parsed = schema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid update." },
      { status: 400 },
    );
  }

  const run = await prisma.run.findUnique({ where: { id: runId } });
  if (!run) {
    return NextResponse.json({ error: "Run not found." }, { status: 404 });
  }

  if (parsed.data.status === "ACTIVE" && run.status !== "ACTIVE") {
    const existingActive = await prisma.run.findFirst({
      where: { status: "ACTIVE", id: { not: run.id } },
    });
    if (existingActive) {
      return NextResponse.json(
        { error: `"${existingActive.name}" is already active. Complete it first.` },
        { status: 409 },
      );
    }
  }

  let winnerCardId: string | null | undefined = undefined;
  if (parsed.data.status === "COMPLETED") {
    if (!rawBody || typeof rawBody !== "object" || !("winnerCardId" in rawBody)) {
      return NextResponse.json(
        { error: "Select a winner (or confirm no winner) before completing the run." },
        { status: 400 },
      );
    }
    winnerCardId = parsed.data.winnerCardId ?? null;
    if (winnerCardId) {
      const card = await prisma.bingoCard.findUnique({ where: { id: winnerCardId } });
      if (!card || card.runId !== run.id) {
        return NextResponse.json({ error: "That card isn't part of this run." }, { status: 400 });
      }
    }
  }

  const updated = await prisma.run.update({
    where: { id: run.id },
    data: {
      status: parsed.data.status,
      name: parsed.data.name,
      winnerCardId,
      completedAt: parsed.data.status === "COMPLETED" ? new Date() : undefined,
    },
  });

  return NextResponse.json({ run: updated });
}

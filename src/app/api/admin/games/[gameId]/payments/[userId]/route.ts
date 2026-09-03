import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({ paid: z.boolean(), note: z.string().max(200).optional() });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string; userId: string }> },
) {
  const { gameId, userId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment update." }, { status: 400 });
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }

  const payment = await prisma.payment.upsert({
    where: { gameId_userId: { gameId, userId } },
    update: {
      paid: parsed.data.paid,
      paidAt: parsed.data.paid ? new Date() : null,
      note: parsed.data.note,
    },
    create: {
      gameId,
      userId,
      amountDue: game.entryFee,
      paid: parsed.data.paid,
      paidAt: parsed.data.paid ? new Date() : null,
      note: parsed.data.note,
    },
  });

  return NextResponse.json({ payment });
}

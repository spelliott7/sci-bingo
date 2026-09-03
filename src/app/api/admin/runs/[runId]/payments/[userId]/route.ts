import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({ paid: z.boolean(), note: z.string().max(200).optional() });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string; userId: string }> },
) {
  const { runId, userId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment update." }, { status: 400 });
  }

  const run = await prisma.run.findUnique({ where: { id: runId } });
  if (!run) {
    return NextResponse.json({ error: "Run not found." }, { status: 404 });
  }

  const payment = await prisma.payment.upsert({
    where: { runId_userId: { runId, userId } },
    update: {
      paid: parsed.data.paid,
      paidAt: parsed.data.paid ? new Date() : null,
      note: parsed.data.note,
    },
    create: {
      runId,
      userId,
      amountDue: run.entryFee,
      paid: parsed.data.paid,
      paidAt: parsed.data.paid ? new Date() : null,
      note: parsed.data.note,
    },
  });

  return NextResponse.json({ payment });
}

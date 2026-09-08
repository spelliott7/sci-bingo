import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  showDate: z.string().min(1, "Pick a show date.").optional(),
  name: z.string().trim().max(120).nullable().optional(),
  venue: z.string().trim().max(160).nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ showId: string }> },
) {
  const { showId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid update." },
      { status: 400 },
    );
  }

  const show = await prisma.show.findUnique({ where: { id: showId } });
  if (!show) {
    return NextResponse.json({ error: "Show not found." }, { status: 404 });
  }

  let showDate: Date | undefined;
  if (parsed.data.showDate !== undefined) {
    showDate = new Date(parsed.data.showDate);
    if (Number.isNaN(showDate.getTime())) {
      return NextResponse.json({ error: "That show date isn't valid." }, { status: 400 });
    }
  }

  const updated = await prisma.show.update({
    where: { id: showId },
    data: {
      showDate,
      name: parsed.data.name === undefined ? undefined : parsed.data.name || null,
      venue: parsed.data.venue === undefined ? undefined : parsed.data.venue || null,
    },
  });

  return NextResponse.json({ show: updated });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const run = await prisma.run.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ run });
}

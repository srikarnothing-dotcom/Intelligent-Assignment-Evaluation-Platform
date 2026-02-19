import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        creator: { select: { name: true, email: true } },
        submissions: {
          include: {
            student: { select: { name: true, email: true } },
            feedback: true,
          },
        },
      },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    return NextResponse.json(assignment);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch assignment" },
      { status: 500 }
    );
  }
}

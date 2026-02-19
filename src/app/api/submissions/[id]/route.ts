import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        assignment: { select: { title: true, description: true, id: true } },
        student: { select: { name: true, email: true } },
        feedback: true,
      },
    });
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    return NextResponse.json(submission);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 }
    );
  }
}

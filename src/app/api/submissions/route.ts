import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateSubmission } from "@/lib/ai/evaluate";

// GET submissions (?assignmentId=... | ?studentId=...)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get("assignmentId");
    const studentId = searchParams.get("studentId");

    const submissions = await prisma.submission.findMany({
      where: {
        ...(assignmentId && { assignmentId }),
        ...(studentId && { studentId }),
      },
      include: {
        assignment: { select: { title: true, id: true } },
        student: { select: { name: true, email: true } },
        feedback: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json(submissions);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

// POST create submission
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assignmentId, studentId, content, fileUrl } = body;

    if (!assignmentId || !studentId || !content) {
      return NextResponse.json(
        { error: "assignmentId, studentId, and content are required" },
        { status: 400 }
      );
    }

    if (typeof content !== "string" || content.trim().length < 10) {
      return NextResponse.json(
        { error: "Content must be at least 10 characters" },
        { status: 400 }
      );
    }

    const submission = await prisma.submission.create({
      data: {
        assignmentId,
        studentId,
        content: content.trim(),
        fileUrl: fileUrl ?? null,
      },
      include: {
        assignment: { select: { title: true } },
        student: { select: { name: true } },
      },
    });

    // Auto-evaluate
    const result = await evaluateSubmission(submission.id);
    return NextResponse.json({
      submission: {
        id: submission.id,
        status: submission.status,
        submittedAt: submission.submittedAt,
        assignment: submission.assignment,
        student: submission.student,
      },
      evaluation: result,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 }
    );
  }
}

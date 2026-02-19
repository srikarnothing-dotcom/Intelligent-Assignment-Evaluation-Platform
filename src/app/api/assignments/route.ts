import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET assignments (optional: ?instructorId=...)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const instructorId = searchParams.get("instructorId");

    const assignments = await prisma.assignment.findMany({
      where: instructorId ? { createdById: instructorId } : undefined,
      include: {
        creator: { select: { name: true, email: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(assignments);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

// POST create assignment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, dueDate, maxScore, createdById } = body;

    if (!title || !createdById) {
      return NextResponse.json(
        { error: "title and createdById are required" },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description: description ?? "",
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore: maxScore ?? 100,
        createdById,
      },
    });
    return NextResponse.json(assignment);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}

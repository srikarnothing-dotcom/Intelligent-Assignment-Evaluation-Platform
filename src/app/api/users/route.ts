import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET all users (for demo)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
    });
    return NextResponse.json(users);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST create user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, role } = body;

    if (!email || !name || !role) {
      return NextResponse.json(
        { error: "email, name, and role are required" },
        { status: 400 }
      );
    }

    if (!["student", "instructor"].includes(role)) {
      return NextResponse.json(
        { error: "role must be 'student' or 'instructor'" },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: { email, name, role },
    });
    return NextResponse.json(user);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

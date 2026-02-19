/**
 * File upload API (bonus)
 * Accepts text/plain files and returns extracted content
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const type = file.type;
    const size = file.size;

    if (size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be under 2MB" },
        { status: 400 }
      );
    }

    // Accept text files
    if (type === "text/plain" || file.name.endsWith(".txt")) {
      const text = await file.text();
      return NextResponse.json({
        success: true,
        content: text,
        filename: file.name,
        type: "text",
      });
    }

    // PDF would require pdf-parse or similar - return helpful error
    if (type === "application/pdf" || file.name.endsWith(".pdf")) {
      return NextResponse.json(
        {
          error: "PDF support: Install pdf-parse package for server-side extraction, or use client-side PDF.js",
          suggestion: "For now, paste text or upload .txt files",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Unsupported file type. Use .txt or paste text." },
      { status: 400 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

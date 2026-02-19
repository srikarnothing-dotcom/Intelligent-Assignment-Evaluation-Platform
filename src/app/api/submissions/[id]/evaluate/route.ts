import { NextRequest, NextResponse } from "next/server";
import { evaluateSubmission } from "@/lib/ai/evaluate";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await evaluateSubmission(id);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Evaluation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * Example API response matching the expected output format
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    submission_id: "S103",
    plagiarism_risk: "22%",
    feedback_summary: "The explanation lacks depth in section 2.",
    score: 68,
  });
}

/**
 * Main evaluation orchestrator
 * Combines plagiarism detection + feedback generation
 */
import { prisma } from "@/lib/db";
import { computePlagiarismRisk } from "./plagiarism";
import { generateFeedback, type FeedbackResult } from "./feedback";

export interface EvaluationResult {
  submission_id: string;
  plagiarism_risk: string;
  feedback_summary: string;
  score: number;
  detailedFeedback?: string;
}

export async function evaluateSubmission(submissionId: string): Promise<EvaluationResult> {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: true,
      feedback: true,
    },
  });

  if (!submission) {
    throw new Error("Submission not found");
  }

  // Get other submissions for the same assignment (for plagiarism check)
  const otherSubmissions = await prisma.submission.findMany({
    where: {
      assignmentId: submission.assignmentId,
      id: { not: submissionId },
      content: { not: "" },
    },
    select: { content: true },
  });

  const otherContents = otherSubmissions.map((s) => s.content);
  const plagiarismRisk = computePlagiarismRisk(submission.content, otherContents);

  const feedbackResult: FeedbackResult = generateFeedback(
    submission.content,
    submission.assignment.title
  );

  // Adjust score based on plagiarism (penalize high plagiarism)
  let finalScore = feedbackResult.score;
  if (plagiarismRisk > 30) {
    finalScore = Math.max(0, finalScore - Math.floor(plagiarismRisk / 5));
  }

  // Upsert feedback
  await prisma.feedback.upsert({
    where: { submissionId },
    create: {
      submissionId,
      score: finalScore,
      plagiarismRisk,
      feedbackSummary: feedbackResult.feedbackSummary,
      detailedFeedback: feedbackResult.detailedFeedback,
    },
    update: {
      score: finalScore,
      plagiarismRisk,
      feedbackSummary: feedbackResult.feedbackSummary,
      detailedFeedback: feedbackResult.detailedFeedback,
    },
  });

  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: "evaluated" },
  });

  return {
    submission_id: submissionId,
    plagiarism_risk: `${plagiarismRisk}%`,
    feedback_summary: feedbackResult.feedbackSummary,
    score: finalScore,
    detailedFeedback: feedbackResult.detailedFeedback,
  };
}

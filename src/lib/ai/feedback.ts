/**
 * Rule-based automated feedback generation
 * Analyzes content for structure, depth, length, and common criteria
 */

export interface FeedbackResult {
  score: number;
  feedbackSummary: string;
  detailedFeedback: string;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countSentences(text: string): number {
  const matches = text.match(/[.!?]+/g);
  return matches ? matches.length : 1;
}

function hasIntroduction(text: string): boolean {
  const lower = text.toLowerCase();
  const introPhrases = [
    "introduction",
    "in this ",
    "this paper",
    "this essay",
    "we will",
    "i will",
    "the purpose",
    "overview",
    "first",
    "initially",
  ];
  return introPhrases.some((p) => lower.includes(p));
}

function hasConclusion(text: string): boolean {
  const lower = text.toLowerCase();
  const conclPhrases = [
    "conclusion",
    "in conclusion",
    "to conclude",
    "summary",
    "in summary",
    "finally",
    "overall",
    "therefore",
    "thus",
  ];
  return conclPhrases.some((p) => lower.includes(p));
}

function estimateDepth(text: string): number {
  let depth = 0;
  const lower = text.toLowerCase();
  const depthIndicators = [
    "however",
    "although",
    "furthermore",
    "moreover",
    "therefore",
    "because",
    "example",
    "specifically",
    "additionally",
  ];
  for (const w of depthIndicators) {
    if (lower.includes(w)) depth += 10;
  }
  return Math.min(30, depth);
}

/**
 * Generate rule-based feedback and score
 */
export function generateFeedback(
  content: string,
  assignmentTitle?: string
): FeedbackResult {
  const words = countWords(content);
  const sentences = countSentences(content);
  const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;

  let score = 50; // Base score
  const feedbackParts: string[] = [];

  // Length check (assume 200-500 words is good range for typical assignment)
  if (words < 50) {
    score -= 25;
    feedbackParts.push("The submission is too short and lacks sufficient content.");
  } else if (words < 150) {
    score -= 10;
    feedbackParts.push("The submission could benefit from more elaboration.");
  } else if (words >= 300 && words <= 600) {
    score += 10;
    feedbackParts.push("Good length and development.");
  } else if (words > 600) {
    score += 5;
  }

  // Structure checks
  if (!hasIntroduction(content)) {
    score -= 8;
    feedbackParts.push("Consider adding a clear introduction.");
  }
  if (!hasConclusion(content)) {
    score -= 8;
    feedbackParts.push("A conclusion would strengthen the submission.");
  }

  // Sentence variety
  if (avgWordsPerSentence < 8 && words > 50) {
    score -= 5;
    feedbackParts.push("Sentences could be more varied in length.");
  } else if (avgWordsPerSentence >= 12 && avgWordsPerSentence <= 25) {
    score += 5;
  }

  // Depth
  const depthBonus = estimateDepth(content);
  score += depthBonus;

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  const feedbackSummary =
    feedbackParts.length > 0
      ? feedbackParts.join(" ")
      : "The submission meets basic requirements. Consider adding more analytical depth.";

  const detailedFeedback = [
    `Word count: ${words}`,
    `Sentence count: ${sentences}`,
    `Structure: ${hasIntroduction(content) ? "Has introduction" : "Missing introduction"}, ${hasConclusion(content) ? "has conclusion" : "missing conclusion"}`,
    ...feedbackParts,
  ].join(". ");

  return {
    score,
    feedbackSummary,
    detailedFeedback,
  };
}

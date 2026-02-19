/**
 * TF-IDF + Cosine Similarity for Plagiarism Detection
 * Compares submission against other submissions to flag plagiarism risk
 */

// Tokenize text into words (lowercase, remove punctuation)
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

// Compute term frequency
function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  const len = tokens.length;
  for (const [term, count] of tf) {
    tf.set(term, count / len);
  }
  return tf;
}

// Compute IDF for terms across documents
function inverseDocumentFrequency(
  documents: string[][],
  term: string
): number {
  const docsContaining = documents.filter((doc) =>
    doc.some((t) => t.toLowerCase() === term.toLowerCase())
  ).length;
  return Math.log((documents.length + 1) / (docsContaining + 1)) + 1;
}

// TF-IDF vector for a document
function tfidfVector(
  tokens: string[],
  allDocs: string[][],
  vocabulary: Set<string>
): number[] {
  const tf = termFrequency(tokens);
  const vec: number[] = [];
  for (const term of vocabulary) {
    const tfVal = tf.get(term) ?? 0;
    const idfVal = inverseDocumentFrequency(allDocs, term);
    vec.push(tfVal * idfVal);
  }
  return vec;
}

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Compute plagiarism risk (0-100) for a new submission
 * by comparing against all other submissions for the same assignment
 */
export function computePlagiarismRisk(
  newSubmissionText: string,
  otherSubmissions: string[]
): number {
  if (otherSubmissions.length === 0) return 0;

  const newTokens = tokenize(newSubmissionText);
  const otherTokenArrays = otherSubmissions.map((s) => tokenize(s));
  const allDocs = [newTokens, ...otherTokenArrays];

  const vocabulary = new Set<string>();
  for (const doc of allDocs) {
    for (const t of doc) vocabulary.add(t.toLowerCase());
  }

  const newVec = tfidfVector(newTokens, allDocs, vocabulary);
  let maxSim = 0;

  for (let i = 0; i < otherTokenArrays.length; i++) {
    const otherVec = tfidfVector(otherTokenArrays[i], allDocs, vocabulary);
    const sim = cosineSimilarity(newVec, otherVec);
    if (sim > maxSim) maxSim = sim;
  }

  // Convert similarity (0-1) to plagiarism risk percentage (0-100)
  return Math.round(Math.min(100, maxSim * 100));
}

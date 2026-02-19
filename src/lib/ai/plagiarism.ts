/**
 * TF-IDF + Cosine Similarity for Plagiarism Detection
 * Compares a new submission against others to estimate plagiarism risk
 */

// Tokenize: lowercase, remove punctuation, filter very short words
function tokenize(text: string): string[] {
  if (typeof text !== 'string' || !text.trim()) return [];
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1);
}

// Term Frequency - normalized (using plain object instead of Map → safer)
function termFrequency(tokens: string[]): Record<string, number> {
  const tf: Record<string, number> = {};

  if (tokens.length === 0) return tf;

  // Count
  for (const token of tokens) {
    tf[token] = (tf[token] ?? 0) + 1;
  }

  // Normalize
  const docLength = tokens.length;
  for (const term in tf) {
    tf[term] /= docLength;
  }

  return tf;
}

// Smoothed Inverse Document Frequency
function inverseDocumentFrequency(docs: string[][], term: string): number {
  let count = 0;
  for (const doc of docs) {
    if (doc.includes(term)) {
      count++;
    }
  }
  // +1 smoothing avoids division by zero and extreme values
  return Math.log((docs.length + 1) / (count + 1)) + 1;
}

// Build sorted vocabulary (consistency across runs / cold starts)
function buildVocabulary(allDocs: string[][]): string[] {
  const vocab = new Set<string>();
  for (const doc of allDocs) {
    for (const token of doc) {
      vocab.add(token);
    }
  }
  // Sort → guarantees same vector shape every time
  return Array.from(vocab).sort();
}

// Create TF-IDF vector using sorted vocabulary
function tfidfVector(
  tokens: string[],
  allDocs: string[][],
  sortedVocab: string[]
): number[] {
  const tf = termFrequency(tokens);
  
  return sortedVocab.map(term => {
    const tfValue = tf[term] ?? 0;
    const idfValue = inverseDocumentFrequency(allDocs, term);
    return tfValue * idfValue;
  });
}

// Cosine similarity between two equal-length vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 1e-12 ? dotProduct / denominator : 0;
}

/**
 * Main function: Compute plagiarism risk score (0–100)
 * Returns the highest similarity × 100, rounded
 */
export function computePlagiarismRisk(
  newSubmissionText: string,
  otherSubmissions: string[]
): number {
  if (!otherSubmissions?.length) return 0;
  if (typeof newSubmissionText !== 'string' || !newSubmissionText.trim()) return 0;

  const newTokens = tokenize(newSubmissionText);
  if (newTokens.length === 0) return 0;

  const otherTokensList = otherSubmissions
    .filter(s => typeof s === 'string' && s.trim())
    .map(tokenize)
    .filter(toks => toks.length > 0);

  if (otherTokensList.length === 0) return 0;

  const allDocs = [newTokens, ...otherTokensList];

  const sortedVocab = buildVocabulary(allDocs);
  if (sortedVocab.length === 0) return 0;

  const newVector = tfidfVector(newTokens, allDocs, sortedVocab);

  let maxSimilarity = 0;

  for (const otherTokens of otherTokensList) {
    const otherVector = tfidfVector(otherTokens, allDocs, sortedVocab);
    const similarity = cosineSimilarity(newVector, otherVector);
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
    }
  }

  // Scale to 0–100 and round
  return Math.round(Math.min(100, maxSimilarity * 100));
}

// ──────────────────────────────────────────────
// Vercel / Next.js API route handler (pages/api/plagiarism.ts)
// ──────────────────────────────────────────────
import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData =
  | { risk: number }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { newSubmissionText, otherSubmissions } = req.body;

    if (
      typeof newSubmissionText !== 'string' ||
      !Array.isArray(otherSubmissions)
    ) {
      return res.status(400).json({
        error: 'Invalid payload: newSubmissionText must be string, otherSubmissions must be string[]'
      });
    }

    const risk = computePlagiarismRisk(newSubmissionText, otherSubmissions);

    return res.status(200).json({ risk });
  } catch (err: any) {
    console.error('[plagiarism] Error:', err);
    return res.status(500).json({ error: 'Internal computation error' });
  }
}
import fs from "fs";
import path from "path";
import { chunkMarkdown, type Chunk } from "./chunk";

function tokenize(text: string): Set<string> {
  const stopwords = new Set([
    "the",
    "and",
    "or",
    "for",
    "with",
    "to",
    "a",
    "an",
    "of",
    "in",
    "on",
    "is",
    "are",
    "be",
    "this",
    "that",
    "it",
    "as",
    "by",
    "from",
    "your",
    "you",
    "we",
    "our",
    "at",
    "if",
    "not",
    "use",
    "used"
  ]);
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token && !stopwords.has(token))
  );
}

function scoreChunk(chunk: Chunk, query: string, context: string) {
  const queryTokens = tokenize(`${query} ${context}`);
  const headingTokens = tokenize(chunk.heading);
  const contentTokens = tokenize(chunk.content);
  let overlapHeading = 0;
  let overlapContent = 0;

  queryTokens.forEach((token) => {
    if (headingTokens.has(token)) overlapHeading += 1;
    if (contentTokens.has(token)) overlapContent += 1;
  });

  const headingBoost = overlapHeading * 2.2;
  const contentBoost = overlapContent * 1.1;
  const density =
    (overlapHeading + overlapContent) / Math.max(headingTokens.size + contentTokens.size, 1);

  return headingBoost + contentBoost + density;
}

export function loadProductChunks(productId: string): Chunk[] {
  const baseRoot = path.join(process.cwd(), "knowledge_base");
  if (!fs.existsSync(baseRoot)) return [];

  const productIds =
    productId === "all"
      ? fs
          .readdirSync(baseRoot, { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name)
      : [productId];

  const chunks: Chunk[] = [];

  for (const id of productIds) {
    const baseDir = path.join(baseRoot, id);
    if (!fs.existsSync(baseDir)) continue;
    const files = fs.readdirSync(baseDir).filter((file) => file.endsWith(".md"));
    for (const file of files) {
      const fullPath = path.join(baseDir, file);
      const markdown = fs.readFileSync(fullPath, "utf-8");
      const fileChunks = chunkMarkdown(markdown, `${id}/${file}`);
      chunks.push(...fileChunks);
    }
  }

  return chunks;
}

export function retrieveChunks(productId: string, question: string, context: string, limit = 4): Chunk[] {
  const chunks = loadProductChunks(productId);
  const scored = chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, question, context) }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => entry.chunk);
}

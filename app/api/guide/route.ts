import { NextResponse } from "next/server";
import { retrieveChunks } from "@/lib/rag/retrieve";

const MODEL_NAME = "llama-3.1-8b-instant";
export const runtime = "nodejs";

function formatCitations(chunks: ReturnType<typeof retrieveChunks>) {
  return chunks.map((chunk) => `${chunk.source} > ${chunk.heading}`);
}

async function generateWithGemini({
  apiKey,
  chunks,
  question,
  wallType,
  needsMounting,
  toolsUserHas
}: {
  apiKey: string;
  chunks: ReturnType<typeof retrieveChunks>;
  question: string;
  wallType: string;
  needsMounting: boolean;
  toolsUserHas: string[];
}) {
  const system = `You are an IKEA-style assembly assistant. Answer calmly and concisely using ONLY the retrieved notes. Safety first. If information is missing, say what is missing. Do not add tools or steps not present in sources. End with citations like [file > heading].`;

  const retrievedText = chunks
    .map((chunk) => `Source: ${chunk.source} > ${chunk.heading}\n${chunk.content}`)
    .join("\n\n");

  const prompt = `${system}\n\nRetrieved:\n${retrievedText}\n\nContext: wallType=${wallType}, needsMounting=${needsMounting}, userHas=${toolsUserHas.join(", ")}\nQuestion: ${question}\n\nAnswer:`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 400
    })
  });

  if (!response.ok) {
    throw new Error(`Groq error ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  return String(text).trim();
}

function buildMockAnswer(chunks: ReturnType<typeof retrieveChunks>) {
  if (!chunks.length) return "No guidance available yet.";
  const lines = chunks.map((chunk) => `- ${chunk.content}`);
  const citations = formatCitations(chunks)
    .map((label) => `[${label}]`)
    .join(" ");
  return `${lines.join("\n")}\n\n${citations}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, question, wallType, needsMounting, toolsUserHas } = body as {
      productId: string;
      question: string;
      wallType?: string;
      needsMounting?: boolean;
      toolsUserHas?: string[];
    };

    if (!productId || !question) {
      return NextResponse.json({ error: "productId and question are required" }, { status: 400 });
    }

    const chunks = retrieveChunks(productId, question, `${wallType ?? ""} ${needsMounting ?? false} ${(toolsUserHas ?? []).join(" ")}`);
    const apiKey = process.env.GROQ_API_KEY;
    let answer: string;

    if (apiKey) {
      try {
        answer = await generateWithGemini({
          apiKey,
          chunks,
          question,
          wallType: wallType ?? "",
          needsMounting: !!needsMounting,
          toolsUserHas: toolsUserHas ?? []
        });
      } catch (geminiError) {
        console.error("Gemini fallback to local RAG", geminiError);
        answer = buildMockAnswer(chunks);
      }
    } else {
      answer = buildMockAnswer(chunks);
    }

    const citations = formatCitations(chunks);
    const retrievedTitles = chunks.map((chunk) => chunk.heading);

    const cleanedAnswer = answer.replace(/\[[^\]]+\]/g, "").replace(/\s{2,}/g, " ").trim();
    return NextResponse.json({ answerMarkdown: cleanedAnswer, citations, retrievedTitles });
  } catch (error) {
    console.error("/api/guide error", error);
    return NextResponse.json({ error: "Failed to generate guidance" }, { status: 500 });
  }
}

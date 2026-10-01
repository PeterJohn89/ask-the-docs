import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { claude, isDemo, model } from "@/lib/claude";
import { allowRequest, clientIp } from "@/lib/rateLimit";
import { search, type Passage } from "@/lib/search";
import type { Doc } from "@/lib/sampleDocs";

const MAX_CHARS = 300_000;

const AnswerSchema = z.object({
  answer: z.string().describe("Plain English answer, two to five sentences. Say clearly if the passages do not cover it."),
  citations: z.array(z.object({
    source: z.number().describe("Number of the passage used"),
    quote: z.string().describe("Short exact quote from that passage"),
  })),
});

type Citation = { docTitle: string; heading: string; quote: string };

function demoAnswer(passages: Passage[]) {
  const top = passages[0];
  const sentences = top.text.match(/[^.!?]+[.!?]/g) || [top.text];
  return {
    answer: `According to the ${top.docTitle} (${top.heading}): ${sentences.slice(0, 2).map((s) => s.trim()).join(" ")}`,
    citations: passages.slice(0, 2).map<Citation>((p) => ({ docTitle: p.docTitle, heading: p.heading, quote: (p.text.match(/[^.!?]+[.!?]/) || [p.text])[0].trim() })),
  };
}

export async function POST(req: Request) {
  if (!allowRequest(clientIp(req), 30)) {
    return Response.json({ error: "Too many questions. Please try again in an hour." }, { status: 429 });
  }
  const { question, docs } = (await req.json()) as { question?: string; docs?: Doc[] };
  if (!question?.trim()) return Response.json({ error: "Ask a question first." }, { status: 400 });
  if (question.length > 500) return Response.json({ error: "Keep the question under 500 characters." }, { status: 400 });
  if (!docs?.length) return Response.json({ error: "Add at least one document." }, { status: 400 });
  if (docs.reduce((n, d) => n + d.text.length, 0) > MAX_CHARS) {
    return Response.json({ error: "Documents are too large. Keep the library under about 300 KB of text." }, { status: 400 });
  }

  const passages = search(docs, question);
  // Shown in the UI as a retrieval trace: which passages were found and how well they scored.
  const retrieved = passages.map((p) => ({ docTitle: p.docTitle, heading: p.heading, score: Number(p.score.toFixed(2)) }));
  if (!passages.length) {
    return Response.json({ answer: "I couldn't find anything about that in your documents.", citations: [], retrieved, demo: isDemo });
  }

  if (isDemo) {
    await new Promise((r) => setTimeout(r, 700));
    return Response.json({ ...demoAnswer(passages), retrieved, demo: true });
  }

  const context = passages.map((p, i) => `[${i + 1}] ${p.docTitle} > ${p.heading}\n${p.text}`).join("\n\n");
  try {
    const response = await claude().messages.parse({
      model,
      max_tokens: 2000,
      system: "You answer questions about a team's internal documents. Use only the numbered passages provided. If they don't contain the answer, say so instead of guessing.",
      messages: [{ role: "user", content: `Passages:\n\n${context}\n\nQuestion: ${question}` }],
      output_config: { format: zodOutputFormat(AnswerSchema) },
    });
    const out = response.parsed_output;
    if (!out) return Response.json({ error: "Could not answer that. Try rephrasing." }, { status: 422 });
    const citations: Citation[] = out.citations
      .filter((c) => passages[c.source - 1])
      .map((c) => ({ docTitle: passages[c.source - 1].docTitle, heading: passages[c.source - 1].heading, quote: c.quote }));
    return Response.json({ answer: out.answer, citations, retrieved, demo: false });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "The AI service is unavailable right now." }, { status: 502 });
  }
}

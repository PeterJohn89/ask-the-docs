import type { Doc } from "./sampleDocs";

// Retrieval step of RAG: split documents into passages and rank them with BM25.
// Runs locally with no API cost; only the best passages are sent to Claude.

export type Passage = { docId: string; docTitle: string; heading: string; text: string; score: number };

const STOP = new Set("a an and are as at be by can do for from how i if in is it of on or that the this to was what when where which who why will with you your".split(" "));

const tokenize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w)).map((w) => w.replace(/(ing|ed|es|s)$/, ""));

function split(doc: Doc): Omit<Passage, "score">[] {
  const out: Omit<Passage, "score">[] = [];
  let heading = doc.title;
  for (const block of doc.text.split(/\n\s*\n/)) {
    const lines = block.trim().split("\n");
    if (/^#{1,6}\s/.test(lines[0])) {
      heading = lines[0].replace(/^#+\s*/, "");
      lines.shift();
    }
    const text = lines.join(" ").trim();
    if (text) out.push({ docId: doc.id, docTitle: doc.title, heading, text });
  }
  return out;
}

export function search(docs: Doc[], query: string, k = 5): Passage[] {
  const passages = docs.flatMap(split);
  const tokens = passages.map((p) => tokenize(`${p.heading} ${p.text}`));
  const q = Array.from(new Set(tokenize(query)));
  const avg = tokens.reduce((n, t) => n + t.length, 0) / (tokens.length || 1);
  const df = (term: string) => tokens.filter((t) => t.includes(term)).length;

  return passages
    .map((p, i) => {
      let score = 0;
      for (const term of q) {
        const tf = tokens[i].filter((t) => t === term).length;
        if (!tf) continue;
        const idf = Math.log(1 + (passages.length - df(term) + 0.5) / (df(term) + 0.5));
        score += idf * ((tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * (tokens[i].length / avg))));
      }
      return { ...p, score };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

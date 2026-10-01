import Anthropic from "@anthropic-ai/sdk";

// Server only. The key lives in .env.local (or Vercel environment variables) and never reaches the browser.
export const isDemo = !process.env.ANTHROPIC_API_KEY;
export const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

let client: Anthropic | null = null;
export function claude() {
  if (!client) client = new Anthropic();
  return client;
}

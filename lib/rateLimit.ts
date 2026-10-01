// Simple per-visitor limit so nobody can burn through API credit.
// In memory, so it resets when the server restarts; the prepaid credit is the hard stop.
const hits = new Map<string, number[]>();

export function allowRequest(ip: string, limit = 15, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) return false;
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
}

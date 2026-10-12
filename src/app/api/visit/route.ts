import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { currentAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getMemorial } from "@/lib/queries";
import { allow, visitorFingerprint } from "@/lib/security/guard";

// Counts one page view. Called by the page itself once it has loaded, so
// crawlers and link previews (which don't run scripts) are never counted.

const BOT = /bot|crawl|spider|headless|lighthouse|preview|monitor/i;
const DONE = () => new Response(null, { status: 204 });

/** Only the memorial's own pages are counted; every shared tribute counts under one heading. */
function page(path: unknown): string | null {
  if (typeof path !== "string") return null;
  if (path === "/" || path === "/gallery" || path === "/privacy") return path;
  if (/^\/tributes\/[0-9a-f-]{36}$/.test(path)) return "/tributes";
  return null;
}

export async function POST(request: NextRequest) {
  const agent = request.headers.get("user-agent") ?? "";
  if (!agent || BOT.test(agent)) return DONE();

  const path = page(await request.json().then((body) => body?.path, () => null));
  if (!path) return DONE();

  // The family looking after the site shouldn't inflate the numbers.
  if (await currentAdmin()) return DONE();

  // A refresh or a quick return to the same page is one visit, not several.
  const visitor = await visitorFingerprint();
  if (!allow(`visit:${visitor}:${path}`, 1, 30 * 60_000) || !allow(`visits:${visitor}`, 40, 60 * 60_000)) return DONE();

  try {
    const memorial = await getMemorial();
    await (await db()).insert("visits", { id: randomUUID(), memorial_id: memorial.id, path, visitor_hash: visitor, created_at: new Date().toISOString() });
  } catch (error) {
    // Counting must never break the page (for example, before the visits table has been created).
    console.error("Visit not recorded:", error instanceof Error ? error.message : error);
  }
  return DONE();
}

import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { secret } from "@/lib/auth/session";
import { db } from "@/lib/db";
import type { Table } from "@/lib/db/types";

/**
 * A one-way fingerprint of the visitor's address. We never store the raw IP —
 * only this hash, which is enough to rate-limit and to spot repeat reports.
 */
export async function visitorHash(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return createHmac("sha256", secret()).update(`visitor:${ip}`).digest("base64url").slice(0, 24);
}

const buckets = (globalThis as unknown as { __memorialBuckets?: Map<string, number[]> }).__memorialBuckets ??= new Map();

/** In-memory sliding window — for cheap, frequent actions (likes, sign-in attempts). */
export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t: number) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (!v.some((t: number) => now - t < windowMs)) buckets.delete(k);
  }
  return true;
}

/**
 * Database-backed limit for submissions, so it holds across server instances:
 * how many rows has this visitor added to a table in the last `minutes`?
 */
export async function underSubmissionLimit(table: Table, ipHash: string, limit: number, minutes: number) {
  const since = new Date(Date.now() - minutes * 60_000).toISOString();
  const recent = await (await db()).count(table, { where: { ip_hash: ipHash }, after: { column: "created_at", value: since } });
  return recent < limit;
}

/** Bots fill hidden fields and submit instantly; people do neither. */
export function looksAutomated(form: FormData): boolean {
  if (String(form.get("website") ?? "") !== "") return true;
  const elapsed = Number(form.get("elapsed"));
  return !Number.isFinite(elapsed) || elapsed < 2500;
}

export function countLinks(text: string): number {
  return (text.match(/https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|ru|xyz|info|biz|top|click)\b/gi) ?? []).length;
}

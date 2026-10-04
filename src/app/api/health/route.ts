import { NextResponse } from "next/server";
import { secretSource } from "@/lib/auth/session";
import { db, usingSupabase } from "@/lib/db";

// A quick diagnosis for whoever hosts the site: which settings are present
// (never their values) and whether the database answers.
export const dynamic = "force-dynamic";

export async function GET() {
  const report: Record<string, unknown> = {
    storage: usingSupabase ? "supabase" : "local file store",
    supabaseUrl: Boolean(process.env.SUPABASE_URL),
    supabaseKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    sessionSecret: secretSource(),
    siteUrl: process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || "not set",
  };
  try {
    const store = await db();
    const [memorials, administrators] = await Promise.all([store.count("memorials"), store.count("admin_users")]);
    report.database = "ok";
    report.memorials = memorials;
    report.administrators = administrators;
  } catch (error) {
    report.database = "error";
    report.databaseError = error instanceof Error ? error.message : String(error);
  }
  const healthy = report.database === "ok" && report.sessionSecret !== "missing";
  return NextResponse.json({ healthy, ...report }, { status: healthy ? 200 : 500, headers: { "Cache-Control": "no-store" } });
}

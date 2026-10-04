import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import type { AdminUser } from "@/lib/db/types";

const COOKIE = "memorial_admin";
const WEEK = 60 * 60 * 24 * 7;

export type SecretSource = "set" | "derived" | "development" | "missing";

export function secretSource(): SecretSource {
  if ((process.env.SESSION_SECRET?.trim().length ?? 0) >= 32) return "set";
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return "derived";
  return process.env.NODE_ENV === "production" ? "missing" : "development";
}

/**
 * The key that signs admin sessions and anonymises visitor addresses.
 * SESSION_SECRET is preferred; without it, a key is derived from the Supabase
 * secret (one-way, so it never reveals that key) rather than taking the site down.
 */
export function secret(): string {
  switch (secretSource()) {
    case "set":
      return process.env.SESSION_SECRET!.trim();
    case "derived":
      return createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!).update("memorial:session-secret").digest("hex");
    case "development":
      return "development-only-secret-do-not-use-in-production";
    case "missing":
      throw new Error("Set SESSION_SECRET (at least 32 random characters) in the hosting environment.");
  }
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export async function createSession(userId: string): Promise<void> {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + WEEK * 1000 })).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WEEK,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** The signed-in administrator, or null. Verified against the database on every request. */
export const currentAdmin = cache(async (): Promise<AdminUser | null> => {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { uid: string; exp: number };
    if (typeof uid !== "string" || typeof exp !== "number" || exp < Date.now()) return null;
    return (await db()).get("admin_users", uid);
  } catch {
    return null;
  }
});

/** Guards every admin page and every admin action. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

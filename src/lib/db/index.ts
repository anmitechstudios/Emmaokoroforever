import "server-only";
import type { Driver } from "./driver";
import { localDriver } from "./local";
import { supabaseDriver } from "./supabase";
import { seed } from "./seed";

export const usingSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

if (process.env.VERCEL && !usingSupabase) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set on Vercel. Its file system is read-only.");
}

const driver: Driver = usingSupabase ? supabaseDriver : localDriver;

// Remembered per store, so switching from the local file to Supabase (or to a
// different project) while the server is running seeds the new one too.
const store = usingSupabase ? `supabase:${process.env.SUPABASE_URL}` : "local";
const state = globalThis as unknown as { __memorialReady?: Record<string, Promise<void> | undefined> };

/**
 * The database, guaranteed to hold at least the sample memorial and — when
 * ADMIN_EMAIL / ADMIN_PASSWORD are set — a first administrator.
 */
export async function db(): Promise<Driver> {
  const ready = (state.__memorialReady ??= {});
  ready[store] ??= seed(driver).catch((error) => {
    ready[store] = undefined;
    throw error;
  });
  await ready[store];
  return driver;
}

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Driver, Query } from "./driver";
import { cleanSearchTerm } from "./driver";

// Supabase is only ever reached from the server, with the service-role key.
// Row Level Security is enabled with no public policies (see supabase/schema.sql),
// so visitor emails can never be read with the anon key.

let client: SupabaseClient | undefined;

export function supabase(): SupabaseClient {
  client ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

function fail(action: string, error: { message: string }): never {
  throw new Error(`Database ${action} failed: ${error.message}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function filter(builder: any, query: Query = {}) {
  for (const [key, value] of Object.entries(query.where ?? {})) builder = builder.eq(key, value);
  if (query.after) builder = builder.gt(query.after.column, query.after.value);
  if (query.search) {
    const term = cleanSearchTerm(query.search.term);
    if (term) builder = builder.or(query.search.columns.map((c) => `${c}.ilike."%${term}%"`).join(","));
  }
  return builder;
}

export const supabaseDriver: Driver = {
  async list(table, query = {}) {
    let builder = filter(supabase().from(table).select("*"), query);
    for (const { column, ascending = true } of query.order ?? []) builder = builder.order(column, { ascending });
    if (query.limit !== undefined) {
      const start = query.offset ?? 0;
      builder = builder.range(start, start + query.limit - 1);
    }
    const { data, error } = await builder;
    if (error) fail("read", error);
    return data ?? [];
  },
  async count(table, query) {
    const { count, error } = await filter(supabase().from(table).select("id", { count: "exact", head: true }), query);
    if (error) fail("count", error);
    return count ?? 0;
  },
  async get(table, id) {
    const { data, error } = await supabase().from(table).select("*").eq("id", id).maybeSingle();
    if (error) fail("read", error);
    return data ?? null;
  },
  async insert(table, row) {
    const { data, error } = await supabase().from(table).insert(row).select().single();
    if (error) fail("insert", error);
    return data;
  },
  async insertMissing(table, rows) {
    if (!rows.length) return;
    const { error } = await supabase().from(table).upsert(rows, { onConflict: "id", ignoreDuplicates: true });
    if (error) fail("insert", error);
  },
  async update(table, id, patch) {
    const { data, error } = await supabase().from(table).update(patch as Record<string, unknown>).eq("id", id).select().maybeSingle();
    if (error) fail("update", error);
    return data ?? null;
  },
  async remove(table, id) {
    const { error } = await supabase().from(table).delete().eq("id", id);
    if (error) fail("delete", error);
  },
  async adjustLikes(id, by) {
    const { data, error } = await supabase().rpc("adjust_tribute_likes", { p_id: id, p_by: by });
    if (error) fail("update", error);
    return Number(data ?? 0);
  },
};

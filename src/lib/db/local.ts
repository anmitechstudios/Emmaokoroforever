import "server-only";
import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Driver, Query } from "./driver";
import { cleanSearchTerm } from "./driver";
import { TABLES, type Rows, type Table } from "./types";

// A small JSON-file database for local development and previews. It keeps the
// whole dataset in memory, writes through on every change, and re-reads when
// another process has touched the file.

export const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "db.json");

type Store = { [T in Table]: Rows[T][] };
type AnyRow = Record<string, unknown> & { id: string };

const state = globalThis as unknown as { __memorialStore?: { data: Store; mtime: number } };

function empty(): Store {
  return Object.fromEntries(TABLES.map((t) => [t, []])) as unknown as Store;
}

function load(): Store {
  let mtime = 0;
  try {
    mtime = statSync(FILE).mtimeMs;
  } catch {
    // No file yet.
  }
  if (state.__memorialStore && state.__memorialStore.mtime === mtime) return state.__memorialStore.data;
  let data = empty();
  if (mtime) {
    try {
      data = { ...empty(), ...JSON.parse(readFileSync(FILE, "utf8")) };
    } catch {
      // A partially written file — keep what we have in memory if anything.
      if (state.__memorialStore) return state.__memorialStore.data;
    }
  }
  state.__memorialStore = { data, mtime };
  return data;
}

function persist(data: Store) {
  mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2));
  renameSync(tmp, FILE);
  state.__memorialStore = { data, mtime: statSync(FILE).mtimeMs };
}

const rowsOf = (data: Store, table: Table) => data[table] as unknown as AnyRow[];

function matches(row: AnyRow, query: Query): boolean {
  for (const [key, value] of Object.entries(query.where ?? {})) {
    if (row[key] !== value) return false;
  }
  if (query.after && !(String(row[query.after.column]) > query.after.value)) return false;
  if (query.search) {
    const term = cleanSearchTerm(query.search.term).toLowerCase();
    if (term && !query.search.columns.some((c) => String(row[c] ?? "").toLowerCase().includes(term))) return false;
  }
  return true;
}

function select(rows: AnyRow[], query: Query = {}): AnyRow[] {
  let out = rows.filter((row) => matches(row, query));
  for (const { column, ascending = true } of [...(query.order ?? [])].reverse()) {
    out = [...out].sort((a, b) => {
      const x = a[column] as string | number;
      const y = b[column] as string | number;
      return (x < y ? -1 : x > y ? 1 : 0) * (ascending ? 1 : -1);
    });
  }
  const start = query.offset ?? 0;
  return out.slice(start, query.limit === undefined ? undefined : start + query.limit);
}

export const localDriver: Driver = {
  async list(table, query) {
    return structuredClone(select(rowsOf(load(), table), query)) as never;
  },
  async count(table, query) {
    return rowsOf(load(), table).filter((row) => matches(row, query ?? {})).length;
  },
  async get(table, id) {
    const row = rowsOf(load(), table).find((r) => r.id === id);
    return row ? (structuredClone(row) as never) : null;
  },
  async insert(table, row) {
    const data = load();
    rowsOf(data, table).push(structuredClone(row) as unknown as AnyRow);
    persist(data);
    return row;
  },
  async insertMissing(table, rows) {
    const data = load();
    const have = new Set(rowsOf(data, table).map((r) => r.id));
    const fresh = (rows as unknown as AnyRow[]).filter((r) => !have.has(r.id));
    if (!fresh.length) return;
    rowsOf(data, table).push(...structuredClone(fresh));
    persist(data);
  },
  async update(table, id, patch) {
    const data = load();
    const row = rowsOf(data, table).find((r) => r.id === id);
    if (!row) return null;
    Object.assign(row, structuredClone(patch));
    persist(data);
    return structuredClone(row) as never;
  },
  async remove(table, id) {
    const data = load();
    const rows = rowsOf(data, table);
    const index = rows.findIndex((r) => r.id === id);
    if (index === -1) return;
    rows.splice(index, 1);
    persist(data);
  },
  async adjustLikes(id, by) {
    const data = load();
    const row = data.tributes.find((r) => r.id === id);
    if (!row) return 0;
    row.likes = Math.max(0, row.likes + by);
    persist(data);
    return row.likes;
  },
};

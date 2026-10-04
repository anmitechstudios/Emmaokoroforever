import type { Rows, Table } from "./types";

type Scalar = string | number | boolean;

export interface Query {
  where?: Record<string, Scalar>;
  /** Case-insensitive "contains" across several text columns. */
  search?: { columns: string[]; term: string };
  /** Rows whose column is greater than the value (used for "created since"). */
  after?: { column: string; value: string };
  order?: { column: string; ascending?: boolean }[];
  limit?: number;
  offset?: number;
}

/**
 * The whole persistence surface. Two implementations exist: a local JSON file
 * (zero configuration, for development) and Supabase (for production).
 */
export interface Driver {
  list<T extends Table>(table: T, query?: Query): Promise<Rows[T][]>;
  count(table: Table, query?: Query): Promise<number>;
  get<T extends Table>(table: T, id: string): Promise<Rows[T] | null>;
  insert<T extends Table>(table: T, row: Rows[T]): Promise<Rows[T]>;
  /** Inserts rows whose ids are not already present. Safe to run concurrently. */
  insertMissing<T extends Table>(table: T, rows: Rows[T][]): Promise<void>;
  update<T extends Table>(table: T, id: string, patch: Partial<Rows[T]>): Promise<Rows[T] | null>;
  remove(table: Table, id: string): Promise<void>;
  /** Atomically adds `by` to tributes.likes (never below zero) and returns the new total. */
  adjustLikes(id: string, by: number): Promise<number>;
}

/** Strips characters that have meaning in search filters, leaving plain words. */
export function cleanSearchTerm(term: string): string {
  return term
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s'@.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// One HTTP query per call, which suits short-lived server functions (no connection to keep open).
// Made on first use, so pages that never touch orders build and run without DATABASE_URL.
let sql: NeonQueryFunction<false, false> | null = null;

export function db() {
  if (sql) return sql;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  sql = neon(url);
  return sql;
}

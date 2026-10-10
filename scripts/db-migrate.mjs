// Applies the SQL files in db/migrations to the database in DATABASE_URL, in name order, each once.
// Run: npm run db:migrate   (reads .env.local; prints table names, never the connection string)
import { Pool } from "@neondatabase/serverless";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Put it in .env.local first.");
  process.exit(1);
}

const dir = join(import.meta.dirname, "..", "db", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  await client.query("create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())");
  const done = new Set((await client.query("select name from schema_migrations")).rows.map((r) => r.name));
  for (const file of files) {
    if (done.has(file)) continue;
    // Each file runs in its own transaction, so a failing file leaves nothing half applied.
    await client.query("begin");
    try {
      await client.query(readFileSync(join(dir, file), "utf8"));
      await client.query("insert into schema_migrations (name) values ($1)", [file]);
      await client.query("commit");
      console.log(`applied ${file}`);
    } catch (e) {
      await client.query("rollback");
      throw new Error(`${file} failed: ${e.message}`);
    }
  }
  const tables = (await client.query("select table_name from information_schema.tables where table_schema = 'public' order by 1")).rows;
  console.log("tables:", tables.map((t) => t.table_name).join(", "));
} finally {
  client.release();
  await pool.end();
}

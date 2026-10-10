/**
 * Migration runner.
 *
 * Uses drizzle's migrator for correctness (journal-tracked, transactional) and
 * additionally installs the append-only guard on `project_events`, which Drizzle
 * cannot express idempotently inside a generated migration.
 */
import "./load-env";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { env } from "../src/config/env";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(here, "..", "drizzle");

async function main(): Promise<void> {
  const e = env();
  const connection = postgres(e.DIRECT_DATABASE_URL ?? e.DATABASE_URL, {
    max: 1,
    prepare: false,
  });

  try {
    await connection.unsafe(`
      CREATE SCHEMA IF NOT EXISTS "jengapact";
    `);

    const database = drizzle(connection);
    await migrate(database, {
      migrationsFolder,
      // Keep the journal inside the application schema so that dropping the
      // schema resets migrations too (independent of drizzle's default
      // `drizzle` schema, which would otherwise survive a jengapact drop).
      migrationsSchema: "jengapact",
      migrationsTable: "__drizzle_migrations",
    });
    console.log(`[migrate] applied migrations from ${migrationsFolder}`);

    // Append-only ledger guard. The event ledger must never be silently edited
    // or deleted; corrections are new events. The rule is in place BEFORE any
    // seed data exists because the seed writes events.
    // NOTE: `pg_rule` was removed in PostgreSQL 18; `pg_rewrite` is the catalog.
    await connection.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_catalog.pg_rewrite rw
          JOIN pg_catalog.pg_class c ON c.oid = rw.ev_class
          JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'jengapact' AND c.relname = 'project_events'
            AND rw.rulename = 'block_project_events_update'
        ) THEN
          CREATE RULE block_project_events_update AS ON UPDATE TO "jengapact"."project_events"
          DO INSTEAD NOTHING;
          CREATE RULE block_project_events_delete AS ON DELETE TO "jengapact"."project_events"
          DO INSTEAD NOTHING;
        END IF;
      END
      $$;
    `);
    console.log("[migrate] append-only guard installed on jengapact.project_events");
  } finally {
    await connection.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  console.error(
    "[migrate] failed:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
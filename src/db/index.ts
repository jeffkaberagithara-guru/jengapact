import { drizzle, type PostgresJsTransaction } from "drizzle-orm/postgres-js";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import postgres from "postgres";
import { env } from "@/config/env";
import * as schema from "./schema";
import {
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
} from "./auth-schema";

/**
 * Database client.
 *
 * A single pooled connection per process. Next.js dev hot-reload re-evaluates
 * modules, so the client is cached on `globalThis` to avoid exhausting
 * PostgreSQL's connection slots. `max` is deliberately low (10) so many
 * serverless instances stay under the provider's limit.
 *
 * The client is constructed LAZILY, on first query, rather than at module
 * import: `next build` evaluates route modules while collecting page data, and
 * a hosted build may legitimately not expose the runtime database URL to that
 * step. Deferring means a missing variable fails the request that needs it, not
 * the build.
 *
 * Application tables live in the `jengapact` schema (see `pg-schema.ts`), so
 * every query is schema-qualified by Drizzle and no `search_path` manipulation
 * is required.
 */

declare global {
  var __jengapactSql: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  return postgres(env().DIRECT_DATABASE_URL ?? env().DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    // Prepared statements are disabled so the pool can sit behind transaction
    // pooling proxies (PgBouncer, Supavisor) in hosted environments.
    prepare: false,
    onnotice: () => {
      /* Windows/Postgres notices are noisy; ignore. */
    },
  });
}

function getClient() {
  const existing = globalThis.__jengapactSql;
  if (existing) return existing;
  const created = createClient();
  if (process.env.NODE_ENV !== "production") {
    globalThis.__jengapactSql = created;
  }
  return created;
}

function createDatabase() {
  return drizzle(getClient(), {
    schema: {
      ...schema,
      authUsers,
      authSessions,
      authAccounts,
      authVerifications,
    },
  });
}

type Database = ReturnType<typeof createDatabase>;

let cached: Database | null = null;

function getDatabase(): Database {
  return cached ?? (cached = createDatabase());
}

/**
 * Lazily-initialised Drizzle client. Property access triggers construction on
 * first use, so importing this module has no side effects.
 */
export const db = new Proxy({} as Database, {
  get(_target, property) {
    const real = getDatabase();
    const value = (real as unknown as Record<PropertyKey, unknown>)[property];
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
export type { Database };
export type Transaction = PostgresJsTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

/** A Drizzle connection or an open transaction, so services compose atomically. */
export type Db = Database | Transaction;

/**
 * Runs `fn` inside a transaction. Nested calls reuse the outer transaction so
 * composed service functions remain atomic without double-BEGIN errors.
 */
export async function withTransaction<T>(
  fn: (tx: Db) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => fn(tx));
}

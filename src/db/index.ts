import { drizzle, type PostgresJsTransaction } from "drizzle-orm/postgres-js";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import postgres from "postgres";
import { env } from "@/config/env";
import * as schema from "./schema";
import { authAccounts, authSessions, authUsers, authVerifications } from "./auth-schema";

/**
 * Database client.
 *
 * A single pooled connection per process. Next.js dev hot-reload re-evaluates
 * modules, so the client is cached on `globalThis` to avoid exhausting
 * PostgreSQL's connection slots. `max` is deliberately low (10) so many
 * serverless instances stay under the provider's limit.
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

const sql = globalThis.__jengapactSql ?? createClient();
if (process.env.NODE_ENV !== "production") {
  globalThis.__jengapactSql = sql;
}

export const db = drizzle(sql, {
  schema: {
    ...schema,
    authUsers,
    authSessions,
    authAccounts,
    authVerifications,
  },
});

export { schema };
export type Database = typeof db;
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
export async function withTransaction<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => fn(tx));
}

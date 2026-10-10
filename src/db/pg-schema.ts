import { pgSchema } from "drizzle-orm/pg-core";

/**
 * The application's PostgreSQL schema.
 *
 * JengaPact's tables live in a dedicated `jengapact` schema rather than in
 * `public`. This keeps the platform's data logically isolated (the same
 * isolation a dedicated database would give) while remaining inside the single
 * PostgreSQL instance the local development role can address. Production may
 * point `DATABASE_URL` at a dedicated database; the schema name does not change.
 *
 * `public` is deliberately left free of application tables so that a future
 * migration or analytics view cannot collide with them by accident.
 */
export const appSchema = pgSchema("jengapact");

import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit configuration.
 *
 * Migrations use `DIRECT_DATABASE_URL` when present because generation may
 * introspect the database, and pooled URLs are not always introspectable.
 */
const directUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: directUrl ?? "postgresql://localhost:5432/jengapact",
  },
  strict: true,
  verbose: true,
});

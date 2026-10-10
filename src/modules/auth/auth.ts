import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { env } from "@/config/env";
import { db } from "@/db";
import { authSchema } from "@/db/auth-schema";
import { createDomainUser } from "./user";

/**
 * better-auth server instance.
 *
 * Credentials live in the `auth_*` tables; the domain profile in `users` shares
 * the same UUID and is written by the create hook below. `generateId: "uuid"`
 * is required because both stores key on a `uuid` column.
 */
export const auth = betterAuth({
  appName: "JengaPact",
  baseURL: env().AUTH_URL ?? env().NEXT_PUBLIC_APP_URL,
  secret: env().AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  advanced: {
    database: { generateId: "uuid" },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await createDomainUser({
            id: user.id,
            fullName: user.name || user.email,
            email: user.email,
          });
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type Auth = typeof auth;

import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

interface CreateDomainUserInput {
  id: string;
  fullName: string;
  email: string;
}

/**
 * Creates the domain profile that shadows an `auth_users` row. Keyed on the same
 * UUID; a re-run is a no-op so the auth hook is safe to retry.
 */
export async function createDomainUser(
  input: CreateDomainUserInput,
): Promise<void> {
  await db
    .insert(users)
    .values({
      id: input.id,
      fullName: input.fullName,
      email: input.email,
    })
    .onConflictDoNothing({ target: users.id });
}

export type DomainUser = typeof users.$inferSelect;

export async function getDomainUser(
  userId: string,
): Promise<DomainUser | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

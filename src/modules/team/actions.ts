"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { projectEvents, projectMemberships } from "@/db/schema";
import { emptyActionState, type ActionState } from "@/lib/form";
import { loadProjectActor } from "@/modules/access/context";
import { revalidateProject } from "@/modules/projects/revalidate";

export const initialTeamState: ActionState = emptyActionState;

const updateRoleSchema = z.object({
  projectId: z.uuid(),
  userId: z.uuid(),
  role: z.enum([
    "client",
    "contractor",
    "lead_consultant",
    "quantity_surveyor",
    "engineer",
    "project_manager",
    "subcontractor",
    "legal_adviser",
    "dispute_professional",
    "operations",
    "observer",
  ]),
});

export async function updateMemberRoleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updateRoleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const actor = await loadProjectActor(data.projectId);
  if (!actor) return { error: "You do not have access to this project." };
  if (!actor.can("resolve_issue")) return { error: "Not authorized." };

  await db.transaction(async (tx) => {
    await tx
      .update(projectMemberships)
      .set({ role: data.role })
      .where(
        eq(projectMemberships.projectId, data.projectId) &&
          eq(projectMemberships.userId, data.userId),
      );

    await tx.insert(projectEvents).values({
      projectId: data.projectId,
      actorId: actor.userId,
      actorRole: actor.access.roles[0] ?? null,
      eventType: "membership_updated",
      entityType: "project_membership",
      entityId: null,
      summary: "Team member role updated.",
    });
  });

  revalidateProject(data.projectId);
  return { success: "Role updated." };
}

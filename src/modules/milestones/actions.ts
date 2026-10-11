"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { milestones, projectEvents } from "@/db/schema";
import { emptyActionState, type ActionState } from "@/lib/form";
import { loadProjectActor } from "@/modules/access/context";
import { revalidateProject } from "@/modules/projects/revalidate";

export const initialMilestoneState: ActionState = emptyActionState;

const updateSchema = z.object({
  projectId: z.uuid(),
  milestoneId: z.uuid(),
  status: z.enum(["pending", "in_progress", "verified", "certified", "paid", "locked"]),
});

export async function updateMilestoneStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const actor = await loadProjectActor(data.projectId);
  if (!actor) return { error: "You do not have access to this project." };
  if (!actor.can("issue_certificate") && !actor.can("record_payment")) {
    return { error: "Not authorized to update milestones." };
  }

  const [milestone] = await db
    .select()
    .from(milestones)
    .where(eq(milestones.id, data.milestoneId))
    .limit(1);

  if (!milestone || milestone.projectId !== data.projectId) {
    return { error: "Milestone not found." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(milestones)
      .set({
        status: data.status,
        completedAt: data.status === "paid" || data.status === "locked" ? new Date() : milestone.completedAt,
      })
      .where(eq(milestones.id, data.milestoneId));

    await tx.insert(projectEvents).values({
      projectId: data.projectId,
      actorId: actor.userId,
      actorRole: actor.access.roles[0] ?? null,
      eventType: "milestone_updated",
      entityType: "milestone",
      entityId: data.milestoneId,
      summary: `${milestone.code} updated to ${data.status}.`,
    });
  });

  revalidateProject(data.projectId);
  return { success: "Milestone updated." };
}

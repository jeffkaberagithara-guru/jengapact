"use server";

import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { projectEvents, projectIssues } from "@/db/schema";
import { emptyActionState, type ActionState } from "@/lib/form";
import { formatReference } from "@/lib/ids";
import { loadProjectActor } from "@/modules/access/context";
import { revalidateProject } from "@/modules/projects/revalidate";

export const initialIssueState: ActionState = emptyActionState;

const raiseSchema = z.object({
  projectId: z.uuid(),
  type: z.enum(["scope", "payment", "delay", "quality", "defect", "safety", "instruction", "other"]),
  title: z.string().trim().min(3, "Title is too short"),
  description: z.string().trim().min(10, "Describe the issue clearly"),
  severity: z.enum(["low", "medium", "high", "critical"]),
  responsibleUserId: z.uuid().optional(),
  deadline: z.string().trim().optional(),
});

const resolveSchema = z.object({
  projectId: z.uuid(),
  issueId: z.uuid(),
  resolutionNote: z.string().trim().optional(),
});

async function nextReference(projectId: string): Promise<string> {
  const [row] = await db
    .select({ value: count() })
    .from(projectIssues)
    .where(eq(projectIssues.projectId, projectId));
  return formatReference("ISS", (row?.value ?? 0) + 1);
}

export async function raiseIssueAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = raiseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const actor = await loadProjectActor(data.projectId);
  if (!actor) return { error: "You do not have access to this project." };

  const reference = await nextReference(data.projectId);

  let deadline: Date | null = null;
  if (data.deadline) {
    deadline = new Date(data.deadline);
    if (Number.isNaN(deadline.getTime())) {
      return { error: "Deadline must be a valid date." };
    }
  }

  await db.transaction(async (tx) => {
    const [issue] = await tx
      .insert(projectIssues)
      .values({
        projectId: data.projectId,
        reference,
        type: data.type,
        title: data.title,
        description: data.description,
        reporterId: actor.userId,
        severity: data.severity,
        responsibleUserId: data.responsibleUserId || null,
        deadline: deadline ? deadline.toISOString().split("T")[0] : null,
      })
      .returning({ id: projectIssues.id });

    if (!issue) throw new Error("Failed to raise issue");

    await tx.insert(projectEvents).values({
      projectId: data.projectId,
      actorId: actor.userId,
      actorRole: actor.access.roles[0] ?? null,
      eventType: "issue_opened",
      entityType: "issue",
      entityId: issue.id,
      summary: `${reference} "${data.title}" raised.`,
      resultingState: "open",
    });
  });

  revalidateProject(data.projectId);
  return { success: `${reference} raised.` };
}

export async function resolveIssueAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resolveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const actor = await loadProjectActor(data.projectId);
  if (!actor) return { error: "You do not have access to this project." };
  if (!actor.can("resolve_issue")) {
    return { error: "You are not authorized to resolve issues." };
  }

  const [issue] = await db
    .select()
    .from(projectIssues)
    .where(eq(projectIssues.id, data.issueId))
    .limit(1);

  if (!issue || issue.projectId !== data.projectId) {
    return { error: "Issue not found." };
  }
  if (issue.status === "resolved" || issue.status === "closed") {
    return { error: "This issue is already resolved." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(projectIssues)
      .set({
        status: "resolved",
        resolutionNote: data.resolutionNote || null,
        resolvedAt: new Date(),
      })
      .where(eq(projectIssues.id, data.issueId));

    await tx.insert(projectEvents).values({
      projectId: data.projectId,
      actorId: actor.userId,
      actorRole: actor.access.roles[0] ?? null,
      eventType: "issue_resolved",
      entityType: "issue",
      entityId: data.issueId,
      summary: `${issue.reference} resolved.`,
      previousState: issue.status,
      resultingState: "resolved",
    });
  });

  revalidateProject(data.projectId);
  return { success: `${issue.reference} marked as resolved.` };
}

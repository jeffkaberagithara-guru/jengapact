"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  agreementClauses,
  negotiationProposals,
  projectEvents,
} from "@/db/schema";
import { emptyActionState, type ActionState } from "@/lib/form";
import { loadProjectActor } from "@/modules/access/context";
import { getAgreement } from "@/modules/projects/queries";
import { revalidateProject } from "@/modules/projects/revalidate";

export const initialAgreementState: ActionState = emptyActionState;

const proposeSchema = z.object({
  projectId: z.uuid(),
  clauseId: z.uuid(),
  proposedBody: z.string().trim().min(1, "Proposed text cannot be empty"),
  justification: z.string().trim().optional(),
});

const agreeSchema = z.object({
  projectId: z.uuid(),
  clauseId: z.uuid(),
});

export async function proposeClauseChangeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = proposeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const actor = await loadProjectActor(data.projectId);
  if (!actor) return { error: "You do not have access to this project." };
  if (!actor.can("draft_clause")) {
    return { error: "You are not authorized to propose clause changes." };
  }

  const view = await getAgreement(data.projectId);
  if (!view) return { error: "No agreement found for this project." };

  const clause = view.clauses.find((c) => c.id === data.clauseId);
  if (!clause) return { error: "Clause not found." };

  await db.transaction(async (tx) => {
    await tx.insert(negotiationProposals).values({
      clauseId: data.clauseId,
      authorId: actor.userId,
      previousBody: clause.body,
      proposedBody: data.proposedBody,
      justification: data.justification || null,
      status: "proposed",
    });

    await tx
      .update(agreementClauses)
      .set({ status: "in_review" })
      .where(eq(agreementClauses.id, data.clauseId));

    await tx.insert(projectEvents).values({
      projectId: data.projectId,
      actorId: actor.userId,
      actorRole: actor.access.roles[0] ?? null,
      eventType: "clause_proposed",
      entityType: "agreement_clause",
      entityId: data.clauseId,
      summary: `Clause ${clause.sectionCode} text proposed for review.`,
      clauseRef: clause.sectionCode,
    });
  });

  revalidateProject(data.projectId);
  return { success: "Proposal submitted." };
}

export async function acceptClauseProposalAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = agreeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const actor = await loadProjectActor(data.projectId);
  if (!actor) return { error: "You do not have access to this project." };
  if (!actor.can("draft_clause")) {
    return { error: "You are not authorized to accept clause proposals." };
  }

  const view = await getAgreement(data.projectId);
  if (!view) return { error: "No agreement found for this project." };

  const clause = view.clauses.find((c) => c.id === data.clauseId);
  if (!clause) return { error: "Clause not found." };

  const [proposal] = await db
    .select()
    .from(negotiationProposals)
    .where(eq(negotiationProposals.clauseId, data.clauseId))
    .orderBy((t) => t.createdAt)
    .limit(1);

  const newBody = proposal?.proposedBody ?? clause.body;

  await db.transaction(async (tx) => {
    await tx
      .update(agreementClauses)
      .set({ body: newBody, status: "agreed" })
      .where(eq(agreementClauses.id, data.clauseId));

    await tx
      .update(negotiationProposals)
      .set({
        status: "accepted",
        resolvedBy: actor.userId,
        resolvedAt: new Date(),
      })
      .where(eq(negotiationProposals.clauseId, data.clauseId));

    await tx.insert(projectEvents).values({
      projectId: data.projectId,
      actorId: actor.userId,
      actorRole: actor.access.roles[0] ?? null,
      eventType: "clause_agreed",
      entityType: "agreement_clause",
      entityId: data.clauseId,
      summary: `Clause ${clause.sectionCode} agreed.`,
      clauseRef: clause.sectionCode,
    });
  });

  revalidateProject(data.projectId);
  return { success: "Clause marked as agreed." };
}

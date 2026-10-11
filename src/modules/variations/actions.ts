"use server";

import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { projectEvents, variationReviews, variations } from "@/db/schema";
import { emptyActionState, type ActionState } from "@/lib/form";
import { formatReference } from "@/lib/ids";
import { parseAmountToMinor } from "@/lib/money";
import { loadProjectActor } from "@/modules/access/context";
import { revalidateProject } from "@/modules/projects/revalidate";

export const initialVariationState: ActionState = emptyActionState;

const raiseSchema = z.object({
  projectId: z.uuid(),
  title: z.string().trim().min(3, "Give the variation a clear title"),
  description: z
    .string()
    .trim()
    .min(10, "Describe the change in enough detail to be assessed"),
  reason: z.string().trim().optional(),
  claimed: z.string().trim().min(1, "Enter the claimed amount"),
  timeImpactDays: z.coerce.number().int().min(0).catch(0),
  taxIncluded: z.coerce.boolean().catch(false),
});

const reviewSchema = z.object({
  projectId: z.uuid(),
  variationId: z.uuid(),
  type: z.enum(["technical", "commercial"]),
  decision: z.enum(["approved", "rejected", "changes_requested", "noted"]),
  notes: z.string().trim().optional(),
  assessed: z.string().trim().optional(),
});

const idSchema = z.object({
  projectId: z.uuid(),
  variationId: z.uuid(),
});

async function nextReference(projectId: string): Promise<string> {
  const [row] = await db
    .select({ value: count() })
    .from(variations)
    .where(eq(variations.projectId, projectId));
  return formatReference("VAR", (row?.value ?? 0) + 1);
}

export async function raiseVariationAction(
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
  if (!actor.can("submit_variation")) {
    return { error: "You are not authorized to raise variations." };
  }

  const claimedMinor = parseAmountToMinor(data.claimed);
  if (claimedMinor === null || claimedMinor < 0) {
    return { error: "Claimed amount must be a valid amount, e.g. 14,200,000" };
  }

  const reference = await nextReference(data.projectId);

  await db.transaction(async (tx) => {
    const [variation] = await tx
      .insert(variations)
      .values({
        projectId: data.projectId,
        reference,
        title: data.title,
        originatorId: actor.userId,
        reason: data.reason || null,
        description: data.description,
        status: "submitted",
        claimedMinor,
        timeImpactDays: data.timeImpactDays,
        taxIncluded: data.taxIncluded,
        createdBy: actor.userId,
      })
      .returning({ id: variations.id });

    if (!variation) throw new Error("Failed to raise variation");

    await tx.insert(projectEvents).values({
      projectId: data.projectId,
      actorId: actor.userId,
      actorRole: actor.access.roles[0] ?? null,
      eventType: "variation_submitted",
      entityType: "variation",
      entityId: variation.id,
      summary: `${reference} "${data.title}" submitted for review.`,
      previousState: "draft",
      resultingState: "submitted",
      clauseRef: "6.1",
    });
  });

  revalidateProject(data.projectId);
  return { success: `${reference} raised and submitted for review.` };
}

export async function reviewVariationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const actor = await loadProjectActor(data.projectId);
  if (!actor) return { error: "You do not have access to this project." };

  const required =
    data.type === "technical" ? "review_technical" : "review_commercial";
  if (!actor.can(required)) {
    return {
      error:
        data.type === "technical"
          ? "You are not authorized to record a technical review."
          : "You are not authorized to record a commercial review.",
    };
  }

  let assessedMinor: number | null = null;
  if (data.assessed) {
    assessedMinor = parseAmountToMinor(data.assessed);
    if (assessedMinor === null || assessedMinor < 0) {
      return { error: "Assessed amount must be a valid amount." };
    }
  }

  const [variation] = await db
    .select()
    .from(variations)
    .where(eq(variations.id, data.variationId))
    .limit(1);

  if (!variation || variation.projectId !== data.projectId) {
    return { error: "Variation not found." };
  }
  if (variation.status === "executed" || variation.status === "withdrawn") {
    return { error: "This variation can no longer be reviewed." };
  }

  await db.transaction(async (tx) => {
    await tx.insert(variationReviews).values({
      variationId: data.variationId,
      reviewerId: actor.userId,
      type: data.type,
      decision: data.decision,
      notes: data.notes || null,
      assessedMinor,
    });

    const reviews = await tx
      .select({ type: variationReviews.type, decision: variationReviews.decision })
      .from(variationReviews)
      .where(eq(variationReviews.variationId, data.variationId));

    let status: (typeof variations.$inferSelect)["status"] = "under_review";
    if (reviews.some((review) => review.decision === "rejected")) {
      status = "rejected";
    } else if (
      reviews.some((review) => review.decision === "changes_requested")
    ) {
      status = "changes_requested";
    } else if (
      reviews.some(
        (review) => review.type === "commercial" && review.decision === "approved",
      )
    ) {
      status = "ready_for_authorization";
    }

    await tx
      .update(variations)
      .set({
        status,
        assessedMinor:
          data.type === "commercial" && assessedMinor !== null
            ? assessedMinor
            : variation.assessedMinor,
        updatedAt: new Date(),
      })
      .where(eq(variations.id, data.variationId));

    await tx.insert(projectEvents).values({
      projectId: data.projectId,
      actorId: actor.userId,
      actorRole: actor.access.roles[0] ?? null,
      eventType: "variation_review_completed",
      entityType: "variation",
      entityId: data.variationId,
      summary: `${variation.reference} ${data.type} review: ${data.decision.replace(/_/g, " ")}.`,
      previousState: variation.status,
      resultingState: status,
      clauseRef: "6.1",
    });
  });

  revalidateProject(data.projectId);
  return { success: "Review recorded." };
}

export async function authorizeVariationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = idSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const actor = await loadProjectActor(data.projectId);
  if (!actor) return { error: "You do not have access to this project." };
  if (!actor.can("authorize_variation")) {
    return { error: "You are not authorized to authorize variations." };
  }

  const [variation] = await db
    .select()
    .from(variations)
    .where(eq(variations.id, data.variationId))
    .limit(1);

  if (!variation || variation.projectId !== data.projectId) {
    return { error: "Variation not found." };
  }
  if (variation.status === "executed") {
    return { error: "This variation has already been committed." };
  }

  const reviews = await db
    .select({ type: variationReviews.type, decision: variationReviews.decision })
    .from(variationReviews)
    .where(eq(variationReviews.variationId, data.variationId));

  const hasCommercialApproval = reviews.some(
    (review) => review.type === "commercial" && review.decision === "approved",
  );
  if (!hasCommercialApproval) {
    return {
      error: "A commercial review must be approved before this can be authorized.",
    };
  }

  const committedMinor = variation.assessedMinor ?? variation.claimedMinor;

  await db.transaction(async (tx) => {
    await tx
      .update(variations)
      .set({
        status: "executed",
        committedMinor,
        updatedAt: new Date(),
      })
      .where(eq(variations.id, data.variationId));

    await tx.insert(projectEvents).values({
      projectId: data.projectId,
      actorId: actor.userId,
      actorRole: actor.access.roles[0] ?? null,
      eventType: "variation_executed",
      entityType: "variation",
      entityId: data.variationId,
      summary: `${variation.reference} authorized and committed to the contract baseline.`,
      previousState: variation.status,
      resultingState: "executed",
      clauseRef: "6.1",
    });
  });

  revalidateProject(data.projectId);
  return { success: `${variation.reference} committed to the contract value.` };
}

"use server";

import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  paymentCertificates,
  paymentClaims,
  paymentRecords,
  projectEvents,
  valuations,
} from "@/db/schema";
import { emptyActionState, type ActionState } from "@/lib/form";
import { formatReference } from "@/lib/ids";
import { parseAmountToMinor } from "@/lib/money";
import { loadProjectActor } from "@/modules/access/context";
import { revalidateProject } from "@/modules/projects/revalidate";

export const initialPaymentState: ActionState = emptyActionState;

const claimSchema = z.object({
  projectId: z.uuid(),
  claimed: z.string().trim().min(1, "Enter the claimed amount"),
  periodEnd: z.string().trim().optional(),
});

const valuationSchema = z.object({
  projectId: z.uuid(),
  claimId: z.uuid(),
  assessed: z.string().trim().min(1, "Enter the assessed amount"),
  notes: z.string().trim().optional(),
});

const certificateSchema = z.object({
  projectId: z.uuid(),
  claimId: z.uuid().optional(),
  certified: z.string().trim().min(1, "Enter the certified amount"),
  retention: z.string().trim().optional(),
  dueDate: z.string().trim().optional(),
});

const paymentSchema = z.object({
  projectId: z.uuid(),
  certificateId: z.uuid().optional(),
  amount: z.string().trim().min(1, "Enter the amount"),
  method: z.enum(["rtgs", "pesalink", "mpesa_b2b", "cheque", "other"]),
  externalReference: z.string().trim().optional(),
  paidAt: z.string().trim().min(1, "Enter the payment date"),
});

async function nextRef(
  projectId: string,
  prefix: "PC" | "CERT",
): Promise<string> {
  const table = prefix === "PC" ? paymentClaims : paymentCertificates;
  const [row] = await db.select({ value: count() }).from(table).where(eq(table.projectId, projectId));
  return formatReference(prefix, (row?.value ?? 0) + 1);
}

export async function submitClaimAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = claimSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const actor = await loadProjectActor(data.projectId);
  if (!actor) return { error: "You do not have access to this project." };
  if (!actor.can("submit_claim")) {
    return { error: "You are not authorized to submit claims." };
  }

  const claimedMinor = parseAmountToMinor(data.claimed);
  if (claimedMinor === null || claimedMinor < 0) {
    return { error: "Claimed amount must be a valid amount." };
  }

  let periodEnd: string | null = null;
  if (data.periodEnd) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.periodEnd)) {
      return { error: "Period end must be YYYY-MM-DD." };
    }
    periodEnd = data.periodEnd;
  }

  const reference = await nextRef(data.projectId, "PC");

  await db.transaction(async (tx) => {
    const [claim] = await tx
      .insert(paymentClaims)
      .values({
        projectId: data.projectId,
        reference,
        claimantId: actor.userId,
        claimedMinor,
        periodEnd,
        status: "submitted",
      })
      .returning({ id: paymentClaims.id });

    if (!claim) throw new Error("Failed to submit claim");

    await tx.insert(projectEvents).values({
      projectId: data.projectId,
      actorId: actor.userId,
      actorRole: actor.access.roles[0] ?? null,
      eventType: "claim_submitted",
      entityType: "payment_claim",
      entityId: claim.id,
      summary: `${reference} submitted for valuation.`,
      previousState: "draft",
      resultingState: "submitted",
      clauseRef: "11.3",
    });
  });

  revalidateProject(data.projectId);
  return { success: `${reference} submitted.` };
}

export async function recordValuationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = valuationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const actor = await loadProjectActor(data.projectId);
  if (!actor) return { error: "You do not have access to this project." };
  if (!actor.can("assess_valuation")) {
    return { error: "You are not authorized to assess valuations." };
  }

  const assessedMinor = parseAmountToMinor(data.assessed);
  if (assessedMinor === null || assessedMinor < 0) {
    return { error: "Assessed amount must be a valid amount." };
  }

  const [claim] = await db
    .select()
    .from(paymentClaims)
    .where(eq(paymentClaims.id, data.claimId))
    .limit(1);
  if (!claim || claim.projectId !== data.projectId) {
    return { error: "Claim not found." };
  }

  await db.transaction(async (tx) => {
    await tx.insert(valuations).values({
      claimId: data.claimId,
      valuerId: actor.userId,
      assessedMinor,
      notes: data.notes || null,
    });

    await tx
      .update(paymentClaims)
      .set({ status: "assessed", updatedAt: new Date() })
      .where(eq(paymentClaims.id, data.claimId));

    await tx.insert(projectEvents).values({
      projectId: data.projectId,
      actorId: actor.userId,
      actorRole: actor.access.roles[0] ?? null,
      eventType: "claim_assessed",
      entityType: "payment_claim",
      entityId: data.claimId,
      summary: `${claim.reference} assessed at the recorded amount.`,
      previousState: claim.status,
      resultingState: "assessed",
      clauseRef: "11.3",
    });
  });

  revalidateProject(data.projectId);
  return { success: "Valuation recorded." };
}

export async function issueCertificateAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = certificateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const actor = await loadProjectActor(data.projectId);
  if (!actor) return { error: "You do not have access to this project." };
  if (!actor.can("issue_certificate")) {
    return { error: "You are not authorized to issue certificates." };
  }

  const certifiedMinor = parseAmountToMinor(data.certified);
  if (certifiedMinor === null || certifiedMinor < 0) {
    return { error: "Certified amount must be a valid amount." };
  }

  let retentionMinor = 0;
  if (data.retention) {
    const parsedRetention = parseAmountToMinor(data.retention);
    if (parsedRetention === null || parsedRetention < 0) {
      return { error: "Retention must be a valid amount." };
    }
    retentionMinor = parsedRetention;
  }

  let dueDate: string | null = null;
  if (data.dueDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dueDate)) {
      return { error: "Due date must be YYYY-MM-DD." };
    }
    dueDate = data.dueDate;
  }

  const reference = await nextRef(data.projectId, "CERT");

  await db.transaction(async (tx) => {
    const [certificate] = await tx
      .insert(paymentCertificates)
      .values({
        projectId: data.projectId,
        claimId: data.claimId || null,
        reference,
        certifiedMinor,
        retentionMinor,
        status: "issued",
        issuedById: actor.userId,
        issuedAt: new Date(),
        dueDate,
      })
      .returning({ id: paymentCertificates.id });

    if (!certificate) throw new Error("Failed to issue certificate");

    if (data.claimId) {
      await tx
        .update(paymentClaims)
        .set({ status: "certified", updatedAt: new Date() })
        .where(eq(paymentClaims.id, data.claimId));
    }

    await tx.insert(projectEvents).values({
      projectId: data.projectId,
      actorId: actor.userId,
      actorRole: actor.access.roles[0] ?? null,
      eventType: "certificate_issued",
      entityType: "payment_certificate",
      entityId: certificate.id,
      summary: `${reference} issued for ${certifiedMinor / 100} KES.`,
      previousState: "draft",
      resultingState: "issued",
      clauseRef: "11.3",
    });
  });

  revalidateProject(data.projectId);
  return { success: `${reference} issued.` };
}

export async function recordPaymentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const actor = await loadProjectActor(data.projectId);
  if (!actor) return { error: "You do not have access to this project." };
  if (!actor.can("record_payment")) {
    return { error: "You are not authorized to record payments." };
  }

  const amountMinor = parseAmountToMinor(data.amount);
  if (amountMinor === null || amountMinor <= 0) {
    return { error: "Amount must be a positive, valid amount." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.paidAt)) {
    return { error: "Paid at must be YYYY-MM-DD." };
  }

  await db.transaction(async (tx) => {
    const [payment] = await tx
      .insert(paymentRecords)
      .values({
        projectId: data.projectId,
        certificateId: data.certificateId || null,
        amountMinor,
        method: data.method,
        externalReference: data.externalReference || null,
        paidAt: data.paidAt,
        recordedById: actor.userId,
      })
      .returning({ id: paymentRecords.id });

    if (!payment) throw new Error("Failed to record payment");

    await tx.insert(projectEvents).values({
      projectId: data.projectId,
      actorId: actor.userId,
      actorRole: actor.access.roles[0] ?? null,
      eventType: "payment_recorded",
      entityType: "payment_record",
      entityId: payment.id,
      summary: "Payment recorded against the selected certificate/claim.",
      clauseRef: "11.3",
    });
  });

  revalidateProject(data.projectId);
  return { success: "Payment recorded." };
}

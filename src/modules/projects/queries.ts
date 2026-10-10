import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  agreements,
  agreementClauses,
  agreementVersions,
  authorityRules,
  milestones,
  paymentCertificates,
  paymentClaims,
  paymentRecords,
  projectEvents,
  projectIssues,
  projectMemberships,
  projects,
  retentionEntries,
  organizationMembers,
  organizations,
  users,
  valuations,
  variationReviews,
  variations,
  type authorityAction,
  type projectRole,
} from "@/db/schema";

export type ProjectRole = (typeof projectRole.enumValues)[number];
export type AuthorityAction = (typeof authorityAction.enumValues)[number];
export type Project = typeof projects.$inferSelect;

export interface ProjectMembershipView {
  project: Project;
  role: ProjectRole;
}

export interface ProjectAccess {
  project: Project;
  roles: ProjectRole[];
  rules: { action: AuthorityAction; role: ProjectRole }[];
}

export async function listMembershipsForUser(
  userId: string,
): Promise<ProjectMembershipView[]> {
  return db
    .select({ project: projects, role: projectMemberships.role })
    .from(projectMemberships)
    .innerJoin(projects, eq(projects.id, projectMemberships.projectId))
    .where(eq(projectMemberships.userId, userId))
    .orderBy(desc(projects.updatedAt));
}

export async function getProjectAccess(
  projectId: string,
  userId: string,
): Promise<ProjectAccess | null> {
  const [membership] = await db
    .select({ project: projects })
    .from(projectMemberships)
    .innerJoin(projects, eq(projects.id, projectMemberships.projectId))
    .where(
      and(
        eq(projectMemberships.projectId, projectId),
        eq(projectMemberships.userId, userId),
      ),
    )
    .limit(1);

  if (!membership) return null;

  const roleRows = await db
    .select({ role: projectMemberships.role })
    .from(projectMemberships)
    .where(
      and(
        eq(projectMemberships.projectId, projectId),
        eq(projectMemberships.userId, userId),
      ),
    );

  const rules = await db
    .select({ action: authorityRules.action, role: authorityRules.role })
    .from(authorityRules)
    .where(eq(authorityRules.projectId, projectId));

  return {
    project: membership.project,
    roles: roleRows.map((row) => row.role),
    rules,
  };
}

export async function findProjectByReference(
  reference: string,
): Promise<Project | null> {
  const [row] = await db
    .select()
    .from(projects)
    .where(eq(projects.reference, reference))
    .limit(1);
  return row ?? null;
}

export async function getProjectById(
  projectId: string,
): Promise<Project | null> {
  const [row] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  return row ?? null;
}

export interface ProjectOverview {
  originalContractMinor: number;
  committedVariationsMinor: number;
  contractValueMinor: number;
  pendingVariationsMinor: number;
  certifiedMinor: number;
  paidMinor: number;
  outstandingMinor: number;
  retentionHeldMinor: number;
  variationCount: number;
  openIssueCount: number;
  currency: string;
}

export async function getProjectOverview(
  projectId: string,
): Promise<ProjectOverview> {
  const [project] = await db
    .select({
      original: projects.originalContractMinor,
      currency: projects.currency,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  const variationRows = await db
    .select({
      status: variations.status,
      committed: variations.committedMinor,
      assessed: variations.assessedMinor,
      claimed: variations.claimedMinor,
    })
    .from(variations)
    .where(eq(variations.projectId, projectId));

  const certRows = await db
    .select({ certified: paymentCertificates.certifiedMinor })
    .from(paymentCertificates)
    .where(
      and(
        eq(paymentCertificates.projectId, projectId),
        inArray(paymentCertificates.status, ["issued"]),
      ),
    );

  const paymentRows = await db
    .select({ amount: paymentRecords.amountMinor })
    .from(paymentRecords)
    .where(eq(paymentRecords.projectId, projectId));

  const retentionRows = await db
    .select({
      amount: retentionEntries.amountMinor,
      releasedAt: retentionEntries.releasedAt,
    })
    .from(retentionEntries)
    .where(eq(retentionEntries.projectId, projectId));

  const issueRows = await db
    .select({ status: projectIssues.status })
    .from(projectIssues)
    .where(eq(projectIssues.projectId, projectId));

  const committedVariationsMinor = variationRows
    .filter((row) => row.status === "executed")
    .reduce((total, row) => total + (row.committed ?? 0), 0);

  const pendingVariationsMinor = variationRows
    .filter(
      (row) =>
        row.status !== "executed" &&
        row.status !== "rejected" &&
        row.status !== "withdrawn",
    )
    .reduce((total, row) => total + (row.assessed ?? row.claimed ?? 0), 0);

  const certifiedMinor = certRows.reduce(
    (total, row) => total + row.certified,
    0,
  );
  const paidMinor = paymentRows.reduce((total, row) => total + row.amount, 0);
  const retentionHeldMinor = retentionRows
    .filter((row) => row.releasedAt === null)
    .reduce((total, row) => total + row.amount, 0);

  const openIssueCount = issueRows.filter((row) =>
    ["open", "awaiting_response", "under_negotiation", "referred"].includes(
      row.status,
    ),
  ).length;

  const originalContractMinor = project?.original ?? 0;

  return {
    originalContractMinor,
    committedVariationsMinor,
    contractValueMinor: originalContractMinor + committedVariationsMinor,
    pendingVariationsMinor,
    certifiedMinor,
    paidMinor,
    outstandingMinor: Math.max(0, certifiedMinor - paidMinor),
    retentionHeldMinor,
    variationCount: variationRows.length,
    openIssueCount,
    currency: project?.currency ?? "KES",
  };
}

export async function listMilestones(projectId: string) {
  return db
    .select()
    .from(milestones)
    .where(eq(milestones.projectId, projectId))
    .orderBy(asc(milestones.sequence));
}

export interface VariationWithReviews {
  variation: typeof variations.$inferSelect;
  originatorName: string | null;
  reviews: {
    review: typeof variationReviews.$inferSelect;
    reviewerName: string | null;
  }[];
}

export async function listVariations(
  projectId: string,
): Promise<VariationWithReviews[]> {
  const rows = await db
    .select({ variation: variations, originatorName: users.fullName })
    .from(variations)
    .leftJoin(users, eq(users.id, variations.originatorId))
    .where(eq(variations.projectId, projectId))
    .orderBy(desc(variations.createdAt));

  if (rows.length === 0) return [];

  const reviewRows = await db
    .select({ review: variationReviews, reviewerName: users.fullName })
    .from(variationReviews)
    .leftJoin(users, eq(users.id, variationReviews.reviewerId))
    .where(
      inArray(
        variationReviews.variationId,
        rows.map((row) => row.variation.id),
      ),
    )
    .orderBy(asc(variationReviews.createdAt));

  return rows.map((row) => ({
    variation: row.variation,
    originatorName: row.originatorName,
    reviews: reviewRows.filter(
      (review) => review.review.variationId === row.variation.id,
    ),
  }));
}

export interface PaymentLedger {
  claims: {
    claim: typeof paymentClaims.$inferSelect;
    claimantName: string | null;
  }[];
  valuations: {
    valuation: typeof valuations.$inferSelect;
    valuerName: string | null;
  }[];
  certificates: {
    certificate: typeof paymentCertificates.$inferSelect;
    issuerName: string | null;
  }[];
  payments: {
    payment: typeof paymentRecords.$inferSelect;
    recorderName: string | null;
  }[];
  retention: (typeof retentionEntries.$inferSelect)[];
}

export async function getPaymentLedger(
  projectId: string,
): Promise<PaymentLedger> {
  const claims = await db
    .select({ claim: paymentClaims, claimantName: users.fullName })
    .from(paymentClaims)
    .leftJoin(users, eq(users.id, paymentClaims.claimantId))
    .where(eq(paymentClaims.projectId, projectId))
    .orderBy(desc(paymentClaims.createdAt));

  const valuationRows = await db
    .select({ valuation: valuations, valuerName: users.fullName })
    .from(valuations)
    .innerJoin(paymentClaims, eq(paymentClaims.id, valuations.claimId))
    .leftJoin(users, eq(users.id, valuations.valuerId))
    .where(eq(paymentClaims.projectId, projectId))
    .orderBy(desc(valuations.createdAt));

  const certificates = await db
    .select({ certificate: paymentCertificates, issuerName: users.fullName })
    .from(paymentCertificates)
    .leftJoin(users, eq(users.id, paymentCertificates.issuedById))
    .where(eq(paymentCertificates.projectId, projectId))
    .orderBy(desc(paymentCertificates.createdAt));

  const payments = await db
    .select({ payment: paymentRecords, recorderName: users.fullName })
    .from(paymentRecords)
    .leftJoin(users, eq(users.id, paymentRecords.recordedById))
    .where(eq(paymentRecords.projectId, projectId))
    .orderBy(desc(paymentRecords.createdAt));

  const retention = await db
    .select()
    .from(retentionEntries)
    .where(eq(retentionEntries.projectId, projectId))
    .orderBy(desc(retentionEntries.createdAt));

  return {
    claims,
    valuations: valuationRows,
    certificates,
    payments,
    retention,
  };
}

export interface IssueWithPeople {
  issue: typeof projectIssues.$inferSelect;
  reporterName: string | null;
  responsibleName: string | null;
}

export async function listIssues(
  projectId: string,
): Promise<IssueWithPeople[]> {
  const responsible = alias(users, "responsible");

  return db
    .select({
      issue: projectIssues,
      reporterName: users.fullName,
      responsibleName: responsible.fullName,
    })
    .from(projectIssues)
    .leftJoin(users, eq(users.id, projectIssues.reporterId))
    .leftJoin(responsible, eq(responsible.id, projectIssues.responsibleUserId))
    .where(eq(projectIssues.projectId, projectId))
    .orderBy(desc(projectIssues.createdAt));
}

export interface EventWithActor {
  event: typeof projectEvents.$inferSelect;
  actorName: string | null;
}

export async function listEvents(
  projectId: string,
  limit = 100,
): Promise<EventWithActor[]> {
  return db
    .select({ event: projectEvents, actorName: users.fullName })
    .from(projectEvents)
    .leftJoin(users, eq(users.id, projectEvents.actorId))
    .where(eq(projectEvents.projectId, projectId))
    .orderBy(desc(projectEvents.createdAt))
    .limit(limit);
}

export interface AgreementView {
  agreement: typeof agreements.$inferSelect;
  version: typeof agreementVersions.$inferSelect | null;
  clauses: (typeof agreementClauses.$inferSelect)[];
}

export async function getAgreement(
  projectId: string,
): Promise<AgreementView | null> {
  const [agreement] = await db
    .select()
    .from(agreements)
    .where(eq(agreements.projectId, projectId))
    .orderBy(desc(agreements.createdAt))
    .limit(1);

  if (!agreement) return null;

  const version = agreement.currentVersionId
    ? ((
        await db
          .select()
          .from(agreementVersions)
          .where(eq(agreementVersions.id, agreement.currentVersionId))
          .limit(1)
      )[0] ?? null)
    : null;

  const clauses = version
    ? await db
        .select()
        .from(agreementClauses)
        .where(eq(agreementClauses.versionId, version.id))
        .orderBy(asc(agreementClauses.orderIndex))
    : [];

  return { agreement, version, clauses };
}

export interface TeamMember {
  userId: string;
  fullName: string;
  email: string;
  role: ProjectRole;
  organizationName: string | null;
}

export async function listTeam(projectId: string): Promise<TeamMember[]> {
  const rows = await db
    .select({
      userId: projectMemberships.userId,
      fullName: users.fullName,
      email: users.email,
      role: projectMemberships.role,
      organizationName: organizations.name,
    })
    .from(projectMemberships)
    .innerJoin(users, eq(users.id, projectMemberships.userId))
    .leftJoin(
      organizations,
      eq(organizations.id, projectMemberships.organizationId),
    )
    .where(eq(projectMemberships.projectId, projectId))
    .orderBy(asc(projectMemberships.role));

  return rows;
}

export async function listOrganizationsForUser(userId: string) {
  return db
    .select({
      id: organizations.id,
      name: organizations.name,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(
      organizations,
      eq(organizations.id, organizationMembers.organizationId),
    )
    .where(eq(organizationMembers.userId, userId))
    .orderBy(asc(organizations.name));
}

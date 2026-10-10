import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { appSchema } from "./pg-schema";

/**
 * JengaPact domain schema.
 *
 * Design rules reflected below:
 *
 * 1. A submitted claim is NOT a certified amount, and a certificate is NOT a
 *    payment. Those are four separate tables (`payment_claims`, `valuations`,
 *    `payment_certificates`, `payment_records`) precisely so the distinction
 *    cannot be lost in a single status column.
 * 2. A technical recommendation is not a commercial authorization; reviews carry
 *    their type (`variation_reviews.review_type`) and the authority to authorize
 *    is separate and project-scoped (`authority_rules`).
 * 3. Consequential events are append-only (`project_events`); corrections are
 *    new events, never edits of old ones.
 * 4. Money is stored as integer minor units (bigint, JS number mode). There is
 *    no floating-point column anywhere in the financial tables.
 * 5. Every timestamp is `timestamptz`.
 */

/* ────────────────────────────── Enums ────────────────────────────── */

export const orgKind = appSchema.enum("org_kind", [
  "client",
  "contractor",
  "consultancy",
  "government",
  "other",
]);

export const orgRole = appSchema.enum("org_role", ["owner", "admin", "member"]);

export const projectRole = appSchema.enum("project_role", [
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
]);

export const projectStage = appSchema.enum("project_stage", [
  "initiated",
  "negotiate",
  "agree",
  "sign",
  "build",
  "verify",
  "approve",
  "pay",
  "closeout",
]);

export const agreementForm = appSchema.enum("agreement_form", [
  "jbc_1999",
  "fidic_2017_red",
  "fidic_2017_yellow",
  "bespoke",
]);

export const agreementStatus = appSchema.enum("agreement_status", [
  "draft",
  "negotiating",
  "ready_for_signature",
  "executed",
  "superseded",
]);

export const versionStatus = appSchema.enum("version_status", [
  "draft",
  "in_review",
  "executed",
  "superseded",
]);

export const clauseStatus = appSchema.enum("clause_status", [
  "proposed",
  "in_review",
  "agreed",
  "disputed",
]);

export const proposalStatus = appSchema.enum("proposal_status", [
  "proposed",
  "accepted",
  "rejected",
  "withdrawn",
]);

export const variationStatus = appSchema.enum("variation_status", [
  "draft",
  "submitted",
  "under_review",
  "changes_requested",
  "rejected",
  "ready_for_authorization",
  "approved_pending_execution",
  "executed",
  "withdrawn",
]);

export const reviewType = appSchema.enum("review_type", ["technical", "commercial"]);

export const reviewDecision = appSchema.enum("review_decision", [
  "approved",
  "rejected",
  "changes_requested",
  "noted",
]);

export const instructionStatus = appSchema.enum("instruction_status", [
  "issued",
  "acknowledged",
  "superseded",
  "closed",
]);

export const urgency = appSchema.enum("urgency", ["routine", "urgent", "emergency"]);

export const claimStatus = appSchema.enum("claim_status", [
  "draft",
  "submitted",
  "under_assessment",
  "assessed",
  "certified",
  "withdrawn",
]);

export const certificateStatus = appSchema.enum("certificate_status", [
  "draft",
  "issued",
  "superseded",
]);

export const paymentMethod = appSchema.enum("payment_method", [
  "rtgs",
  "pesalink",
  "mpesa_b2b",
  "cheque",
  "other",
]);

export const credentialKind = appSchema.enum("credential_kind", [
  "architect",
  "quantity_surveyor",
  "engineer",
  "nca_contractor",
  "other",
]);

export const credentialStatus = appSchema.enum("credential_status", [
  "self_declared",
  "document_reviewed",
  "independently_verified",
  "expired",
  "revoked",
]);

export const issueType = appSchema.enum("issue_type", [
  "scope",
  "payment",
  "delay",
  "quality",
  "defect",
  "safety",
  "instruction",
  "other",
]);

export const issueStatus = appSchema.enum("issue_status", [
  "open",
  "awaiting_response",
  "under_negotiation",
  "referred",
  "resolved",
  "withdrawn",
  "closed",
]);

export const issueSeverity = appSchema.enum("issue_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const milestoneStatus = appSchema.enum("milestone_status", [
  "pending",
  "in_progress",
  "verified",
  "certified",
  "paid",
  "locked",
]);

export const documentCategory = appSchema.enum("document_category", [
  "agreement",
  "drawing",
  "boq",
  "instruction",
  "site_report",
  "photo",
  "minutes",
  "claim",
  "certificate",
  "approval",
  "defect",
  "dispute",
  "handover",
  "other",
]);

export const notificationStatus = appSchema.enum("notification_status", [
  "queued",
  "sent",
  "delivered",
  "failed",
  "read",
]);

export const invitationStatus = appSchema.enum("invitation_status", [
  "pending",
  "accepted",
  "revoked",
  "expired",
]);

/**
 * The consequential actions a project authority matrix governs. Kept as an enum
 * so an unknown/typo'd action cannot silently grant access.
 */
export const authorityAction = appSchema.enum("authority_action", [
  "draft_clause",
  "execute_agreement",
  "submit_variation",
  "review_technical",
  "review_commercial",
  "authorize_variation",
  "submit_claim",
  "assess_valuation",
  "issue_certificate",
  "record_payment",
  "resolve_issue",
  "export_evidence",
]);

/* ──────────────────────── Timestamp helpers ──────────────────────── */

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/* ────────────────────────── Identity ─────────────────────────── */

/**
 * Domain profile. One row per authenticated person. `id` equals `auth_users.id`.
 * `role`-like authority is NOT stored here — it is derived from organization and
 * project memberships, so a person can be a client on one project and a
 * consultant on another.
 */
export const users = appSchema.table(
  "users",
  {
    id: uuid("id").primaryKey(),
    fullName: text("full_name").notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 24 }),
    jobTitle: text("job_title"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_uniq").on(sql`lower(${t.email})`)],
);

export const organizations = appSchema.table("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  kind: orgKind("kind").notNull().default("other"),
  registrationNumber: text("registration_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const organizationMembers = appSchema.table(
  "organization_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: orgRole("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("organization_members_uniq").on(t.organizationId, t.userId),
    index("organization_members_user_idx").on(t.userId),
  ],
);

/* ────────────────────────── Projects ─────────────────────────── */

export const projects = appSchema.table(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: varchar("reference", { length: 40 }).notNull(),
    name: text("name").notNull(),
    location: text("location"),
    county: text("county"),
    projectType: text("project_type"),
    currency: varchar("currency", { length: 3 }).notNull().default("KES"),
    stage: projectStage("stage").notNull().default("initiated"),
    /**
     * The SIGNED original contract sum in minor units. NULL until an agreement
     * is executed. The live contract value is DERIVED from this plus approved
     * variations — never stored as a mutable summary field.
     */
    originalContractMinor: bigint("original_contract_minor", { mode: "number" }),
    clientOrgId: uuid("client_org_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("projects_reference_uniq").on(t.reference)],
);

export const projectMemberships = appSchema.table(
  "project_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: projectRole("role").notNull(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("project_memberships_uniq").on(t.projectId, t.userId, t.role),
    index("project_memberships_project_idx").on(t.projectId),
    index("project_memberships_user_idx").on(t.userId),
  ],
);

/**
 * Project-scoped authority matrix. Where a row exists it overrides the default
 * role mapping in `modules/access/permissions.ts`; where none exists the
 * default applies. Seeded from the actual appointment, not assumed.
 */
export const authorityRules = appSchema.table(
  "authority_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    action: authorityAction("action").notNull(),
    role: projectRole("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("authority_rules_uniq").on(t.projectId, t.action, t.role)],
);

export const invitations = appSchema.table(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 320 }).notNull(),
    role: projectRole("role").notNull(),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => users.id),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    status: invitationStatus("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("invitations_project_idx").on(t.projectId),
    uniqueIndex("invitations_token_uniq").on(t.tokenHash),
  ],
);

/* ───────────────────────── Milestones ────────────────────────── */

export const milestones = appSchema.table(
  "milestones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    code: varchar("code", { length: 16 }).notNull(),
    name: text("name").notNull(),
    amountMinor: bigint("amount_minor", { mode: "number" }).notNull().default(0),
    status: milestoneStatus("status").notNull().default("pending"),
    targetDate: date("target_date"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("milestones_project_seq_uniq").on(t.projectId, t.sequence)],
);

/* ───────────────────────── Agreements ────────────────────────── */

export const agreements = appSchema.table(
  "agreements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    form: agreementForm("form").notNull(),
    status: agreementStatus("status").notNull().default("draft"),
    currentVersionId: uuid("current_version_id"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    ...timestamps,
  },
  (t) => [index("agreements_project_idx").on(t.projectId)],
);

export const agreementVersions = appSchema.table(
  "agreement_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agreementId: uuid("agreement_id")
      .notNull()
      .references(() => agreements.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 24 }).notNull(),
    status: versionStatus("status").notNull().default("draft"),
    /** SHA-256 over the ordered clause snapshot for this version. */
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    executedAt: timestamp("executed_at", { withTimezone: true }),
    supersededByVersionId: uuid("superseded_by_version_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("agreement_versions_label_uniq").on(t.agreementId, t.label)],
);

export const agreementClauses = appSchema.table(
  "agreement_clauses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agreementId: uuid("agreement_id")
      .notNull()
      .references(() => agreements.id, { onDelete: "cascade" }),
    versionId: uuid("version_id")
      .notNull()
      .references(() => agreementVersions.id, { onDelete: "cascade" }),
    sectionCode: varchar("section_code", { length: 16 }).notNull(),
    heading: text("heading").notNull(),
    body: text("body").notNull(),
    status: clauseStatus("status").notNull().default("proposed"),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("agreement_clauses_version_idx").on(t.versionId)],
);

export const negotiationProposals = appSchema.table(
  "negotiation_proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clauseId: uuid("clause_id")
      .notNull()
      .references(() => agreementClauses.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    previousBody: text("previous_body").notNull(),
    proposedBody: text("proposed_body").notNull(),
    justification: text("justification"),
    status: proposalStatus("status").notNull().default("proposed"),
    resolvedBy: uuid("resolved_by").references(() => users.id),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("negotiation_proposals_clause_idx").on(t.clauseId)],
);

/* ──────────────── Variations, reviews, instructions ──────────────── */

export const variations = appSchema.table(
  "variations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    agreementId: uuid("agreement_id").references(() => agreements.id, {
      onDelete: "set null",
    }),
    reference: varchar("reference", { length: 24 }).notNull(),
    title: text("title").notNull(),
    originatorId: uuid("originator_id")
      .notNull()
      .references(() => users.id),
    reason: text("reason"),
    description: text("description").notNull(),
    scopeExclusions: text("scope_exclusions"),
    status: variationStatus("status").notNull().default("draft"),
    /** Claimed by the contractor, in minor units. */
    claimedMinor: bigint("claimed_minor", { mode: "number" }).notNull().default(0),
    /** Assessed by the QS, in minor units. NULL until a commercial review. */
    assessedMinor: bigint("assessed_minor", { mode: "number" }),
    /** Committed to the baseline only when executed. */
    committedMinor: bigint("committed_minor", { mode: "number" }),
    timeImpactDays: integer("time_impact_days").notNull().default(0),
    taxIncluded: boolean("tax_included").notNull().default(false),
    instructionRef: varchar("instruction_ref", { length: 40 }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("variations_reference_uniq").on(t.projectId, t.reference),
    index("variations_project_idx").on(t.projectId),
  ],
);

export const variationReviews = appSchema.table(
  "variation_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variationId: uuid("variation_id")
      .notNull()
      .references(() => variations.id, { onDelete: "cascade" }),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id),
    type: reviewType("type").notNull(),
    decision: reviewDecision("decision").notNull(),
    notes: text("notes"),
    assessedMinor: bigint("assessed_minor", { mode: "number" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("variation_reviews_variation_idx").on(t.variationId)],
);

export const instructions = appSchema.table(
  "instructions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    reference: varchar("reference", { length: 24 }).notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    issuedById: uuid("issued_by_id")
      .notNull()
      .references(() => users.id),
    urgency: urgency("urgency").notNull().default("routine"),
    status: instructionStatus("status").notNull().default("issued"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("instructions_reference_uniq").on(t.projectId, t.reference)],
);

/* ───────────────────────── Payments ────────────────────────── */

export const paymentClaims = appSchema.table(
  "payment_claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    reference: varchar("reference", { length: 24 }).notNull(),
    claimantId: uuid("claimant_id")
      .notNull()
      .references(() => users.id),
    claimedMinor: bigint("claimed_minor", { mode: "number" }).notNull(),
    periodEnd: date("period_end"),
    status: claimStatus("status").notNull().default("draft"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("payment_claims_reference_uniq").on(t.projectId, t.reference)],
);

export const valuations = appSchema.table(
  "valuations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    claimId: uuid("claim_id")
      .notNull()
      .references(() => paymentClaims.id, { onDelete: "cascade" }),
    valuerId: uuid("valuer_id")
      .notNull()
      .references(() => users.id),
    assessedMinor: bigint("assessed_minor", { mode: "number" }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("valuations_claim_idx").on(t.claimId)],
);

export const paymentCertificates = appSchema.table(
  "payment_certificates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    claimId: uuid("claim_id").references(() => paymentClaims.id, {
      onDelete: "set null",
    }),
    reference: varchar("reference", { length: 24 }).notNull(),
    /** Gross certified amount in minor units. */
    certifiedMinor: bigint("certified_minor", { mode: "number" }).notNull(),
    retentionMinor: bigint("retention_minor", { mode: "number" }).notNull().default(0),
    status: certificateStatus("status").notNull().default("draft"),
    issuedById: uuid("issued_by_id").references(() => users.id),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    dueDate: date("due_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("payment_certificates_reference_uniq").on(t.projectId, t.reference)],
);

export const paymentRecords = appSchema.table(
  "payment_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    certificateId: uuid("certificate_id").references(() => paymentCertificates.id, {
      onDelete: "set null",
    }),
    amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
    method: paymentMethod("method").notNull().default("rtgs"),
    externalReference: varchar("external_reference", { length: 80 }),
    paidAt: date("paid_at").notNull(),
    recordedById: uuid("recorded_by_id")
      .notNull()
      .references(() => users.id),
    evidenceDocumentId: uuid("evidence_document_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("payment_records_project_idx").on(t.projectId),
    index("payment_records_certificate_idx").on(t.certificateId),
    // A bank reference is unique per project: the same RTGS/Pesalink reference
    // must not be recorded twice under one project.
    uniqueIndex("payment_records_external_ref_uniq")
      .on(t.projectId, t.externalReference)
      .where(sql`${t.externalReference} IS NOT NULL`),
  ],
);

export const retentionEntries = appSchema.table(
  "retention_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    certificateId: uuid("certificate_id").references(() => paymentCertificates.id, {
      onDelete: "set null",
    }),
    amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("retention_entries_project_idx").on(t.projectId)],
);

/* ──────────────── Documents, evidence, event ledger ──────────────── */

export const documents = appSchema.table(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    category: documentCategory("category").notNull().default("other"),
    storageKey: text("storage_key").notNull(),
    mimeType: varchar("mime_type", { length: 128 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    sha256: varchar("sha256", { length: 64 }).notNull(),
    version: integer("version").notNull().default(1),
    uploadedById: uuid("uploaded_by_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("documents_project_idx").on(t.projectId)],
);

export const evidenceLinks = appSchema.table(
  "evidence_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    entityType: varchar("entity_type", { length: 40 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    linkedById: uuid("linked_by_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("evidence_links_entity_idx").on(t.entityType, t.entityId)],
);

/**
 * Append-only project event ledger. Every consequential state change writes one
 * row here inside the same transaction as the change itself. Corrections are new
 * events; rows are never updated or deleted. The DB-level guard is a rule
 * created in the migration (see scripts/migrate.ts).
 */
export const projectEvents = appSchema.table(
  "project_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    actorRole: projectRole("actor_role"),
    eventType: varchar("event_type", { length: 64 }).notNull(),
    entityType: varchar("entity_type", { length: 40 }).notNull(),
    entityId: uuid("entity_id"),
    summary: text("summary").notNull(),
    previousState: varchar("previous_state", { length: 40 }),
    resultingState: varchar("resulting_state", { length: 40 }),
    clauseRef: varchar("clause_ref", { length: 40 }),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("project_events_project_idx").on(t.projectId, t.createdAt),
    index("project_events_entity_idx").on(t.entityType, t.entityId),
  ],
);

/* ────────────────────────── Issues ────────────────────────── */

export const projectIssues = appSchema.table(
  "project_issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    reference: varchar("reference", { length: 24 }).notNull(),
    type: issueType("type").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id),
    severity: issueSeverity("severity").notNull().default("medium"),
    status: issueStatus("status").notNull().default("open"),
    responsibleUserId: uuid("responsible_user_id").references(() => users.id),
    deadline: date("deadline"),
    resolutionNote: text("resolution_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("project_issues_reference_uniq").on(t.projectId, t.reference),
    index("project_issues_project_idx").on(t.projectId),
  ],
);

/* ──────────────── Credentials & notifications ──────────────── */

export const professionalCredentials = appSchema.table(
  "professional_credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: credentialKind("kind").notNull(),
    registrationNumber: text("registration_number").notNull(),
    issuingBody: text("issuing_body").notNull(),
    status: credentialStatus("status").notNull().default("self_declared"),
    /** How the status was arrived at, and by whom. */
    verificationMethod: text("verification_method"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    expiresAt: date("expires_at"),
    evidenceDocumentId: uuid("evidence_document_id").references(() => documents.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("professional_credentials_user_idx").on(t.userId)],
);

export const notifications = appSchema.table(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    type: varchar("type", { length: 64 }).notNull(),
    title: text("title").notNull(),
    body: text("body"),
    status: notificationStatus("status").notNull().default("queued"),
    relatedEntityType: varchar("related_entity_type", { length: 40 }),
    relatedEntityId: uuid("related_entity_id"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.createdAt)],
);

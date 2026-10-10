/**
 * Seed data — the "Sakura Court Estate, Mirema" demo project.
 *
 * This drives the built arena at the BUILD stage: an executed JBC 1999 agreement,
 * an escrow milestone spine, one executed and one in-review variation (with
 * technical + commercial reviews), a certified interim payment that has been
 * UNDERPAID (feeding the payment-dispute demo), and an append-only event ledger.
 *
 * Registering a new account does NOT collide with these profiles: the seed only
 * writes domain tables. A freshly registered developer account joins the project
 * through the invitation flow. `db:reset` (drop jengapact + drizzle, migrate)
 * followed by `db:seed` returns the database to this exact state.
 */
import "./load-env";
import { sql } from "drizzle-orm";
import { db } from "../src/db";
import {
  agreementClauses,
  agreements,
  agreementVersions,
  authorityRules,
  instructions,
  milestones,
  notifications,
  organizationMembers,
  organizations,
  paymentCertificates,
  paymentClaims,
  paymentRecords,
  projectEvents,
  projectIssues,
  projectMemberships,
  projects,
  retentionEntries,
  users,
  valuations,
  variations,
  variationReviews,
} from "../src/db/schema";
import { contentHash, formatReference } from "../src/lib/ids";

const toMinor = (major: number): number => major * 100;
const daysAgo = (days: number, hour = 9): Date => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 30, 0, 0);
  return d;
};

/** Explicit enum unions (drizzle's `enumValues` typing is widened to `string[]`). */
type _MilestoneStatusValue =
  "pending" | "in_progress" | "verified" | "certified" | "paid" | "locked";
type ClauseStatusValue = "proposed" | "in_review" | "agreed" | "disputed";
type AuthorityActionValue =
  | "draft_clause"
  | "execute_agreement"
  | "submit_variation"
  | "review_technical"
  | "review_commercial"
  | "authorize_variation"
  | "submit_claim"
  | "assess_valuation"
  | "issue_certificate"
  | "record_payment"
  | "resolve_issue"
  | "export_evidence";
type ProjectRoleValue =
  | "client"
  | "contractor"
  | "lead_consultant"
  | "quantity_surveyor"
  | "engineer"
  | "project_manager"
  | "subcontractor"
  | "legal_adviser"
  | "dispute_professional"
  | "operations"
  | "observer";

/* ───────────────────────────── actors ───────────────────────────── */
const ids = {
  muthoni: "10000000-0000-0000-0000-000000000001",
  daniel: "10000000-0000-0000-0000-000000000002",
  wanjiru: "10000000-0000-0000-0000-000000000003",
  wambui: "10000000-0000-0000-0000-000000000004",
  samuel: "10000000-0000-0000-0000-000000000005",

  safariSprings: "20000000-0000-0000-0000-000000000001",
  kaptim: "20000000-0000-0000-0000-000000000002",
  thiongoAssociates: "20000000-0000-0000-0000-000000000003",

  project: "30000000-0000-0000-0000-000000000001",
  agreement: "30000000-0000-0000-0000-000000000010",
  agreementV1: "30000000-0000-0000-0000-000000000011",

  var006: "30000000-0000-0000-0000-000000000020",
  var014: "30000000-0000-0000-0000-000000000021",

  claim004: "30000000-0000-0000-0000-000000000030",
  valuation004: "30000000-0000-0000-0000-000000000031",
  cert004: "30000000-0000-0000-0000-000000000032",
  cert004Retention: "30000000-0000-0000-0000-000000000033",
  payment004: "30000000-0000-0000-0000-000000000034",

  issue001: "30000000-0000-0000-0000-000000000040",

  invoice001: "30000000-0000-0000-0000-000000000050",
};

async function main(): Promise<void> {
  await db.execute(
    sql.raw(
      `TRUNCATE "jengapact"."notifications", "jengapact"."professional_credentials",
        "jengapact"."project_issues", "jengapact"."project_events",
        "jengapact"."evidence_links", "jengapact"."documents",
        "jengapact"."retention_entries", "jengapact"."payment_records",
        "jengapact"."payment_certificates", "jengapact"."valuations",
        "jengapact"."payment_claims", "jengapact"."instructions",
        "jengapact"."variation_reviews", "jengapact"."variations",
        "jengapact"."negotiation_proposals", "jengapact"."agreement_clauses",
        "jengapact"."agreement_versions", "jengapact"."agreements",
        "jengapact"."milestones", "jengapact"."invitations",
        "jengapact"."authority_rules", "jengapact"."project_memberships",
        "jengapact"."projects", "jengapact"."organization_members",
        "jengapact"."organizations", "jengapact"."users" CASCADE`,
    ),
  );

  await db.transaction(async (tx) => {
    /* ───────────────────────────── organisations ───────────────────────────── */
    await tx.insert(organizations).values([
      {
        id: ids.safariSprings,
        name: "Safari Springs Holdings",
        kind: "client" as const,
      },
      {
        id: ids.kaptim,
        name: "Kaptim Builders Limited",
        kind: "contractor" as const,
      },
      {
        id: ids.thiongoAssociates,
        name: "Thiongo & Associates Architects",
        kind: "consultancy" as const,
      },
    ]);

    await tx.insert(users).values([
      {
        id: ids.muthoni,
        fullName: "Muthoni Karumba",
        email: "muthoni@example.dev",
        phone: "+254701112223",
        jobTitle: "Principal Developer",
      },
      {
        id: ids.daniel,
        fullName: "Daniel Kiptoo",
        email: "dkiptoo@example.dev",
        phone: "+254722334455",
        jobTitle: "Managing Director",
      },
      {
        id: ids.wanjiru,
        fullName: "Wanjiru Thiongo",
        email: "wanjiru@example.dev",
        phone: "+254733445566",
        jobTitle: "Design Lead",
      },
      {
        id: ids.wambui,
        fullName: "Wambui Kamau",
        email: "wkamau@example.dev",
        phone: "+254744556677",
        jobTitle: "Quantity Surveyor",
      },
      {
        id: ids.samuel,
        fullName: "Samuel Odhiambo",
        email: "sodhiambo@example.dev",
        phone: "+254755667788",
        jobTitle: "Structural Engineer",
      },
    ]);

    await tx.insert(organizationMembers).values([
      {
        organizationId: ids.safariSprings,
        userId: ids.muthoni,
        role: "owner" as const,
      },
      {
        organizationId: ids.kaptim,
        userId: ids.daniel,
        role: "owner" as const,
      },
      {
        organizationId: ids.thiongoAssociates,
        userId: ids.wanjiru,
        role: "owner" as const,
      },
      {
        organizationId: ids.thiongoAssociates,
        userId: ids.wambui,
        role: "admin" as const,
      },
      {
        organizationId: ids.thiongoAssociates,
        userId: ids.samuel,
        role: "admin" as const,
      },
    ]);

    /* ───────────────────────────── project ───────────────────────────── */
    await tx.insert(projects).values([
      {
        id: ids.project,
        reference: "SC-2026-001",
        name: "Sakura Court Estate — Mirema",
        location: "Mirema, Kiambu Road",
        county: "Kiambu",
        projectType: "Residential — 68 units",
        currency: "KES",
        stage: "build" as const,
        // Signed contract sum: KSh 486,000,000.00
        originalContractMinor: toMinor(486_000_000),
        clientOrgId: ids.safariSprings,
        createdBy: ids.muthoni,
      },
    ]);

    await tx.insert(projectMemberships).values([
      {
        projectId: ids.project,
        userId: ids.muthoni,
        role: "client" as const,
        organizationId: ids.safariSprings,
      },
      {
        projectId: ids.project,
        userId: ids.daniel,
        role: "contractor" as const,
        organizationId: ids.kaptim,
      },
      {
        projectId: ids.project,
        userId: ids.wanjiru,
        role: "lead_consultant" as const,
        organizationId: ids.thiongoAssociates,
      },
      {
        projectId: ids.project,
        userId: ids.wambui,
        role: "quantity_surveyor" as const,
        organizationId: ids.thiongoAssociates,
      },
      {
        projectId: ids.project,
        userId: ids.samuel,
        role: "engineer" as const,
        organizationId: ids.thiongoAssociates,
      },
    ]);

    /* ─────────────── authority matrix (explicit, seeded from appointment) ─────────────── */
    const authority: Array<[AuthorityActionValue, ProjectRoleValue]> = [
      ["execute_agreement", "client"],
      ["authorize_variation", "client"],
      ["draft_clause", "lead_consultant"],
      ["review_technical", "engineer"],
      ["review_commercial", "quantity_surveyor"],
      ["submit_variation", "contractor"],
      ["submit_claim", "contractor"],
      ["assess_valuation", "quantity_surveyor"],
      ["issue_certificate", "quantity_surveyor"],
      ["record_payment", "client"],
      ["resolve_issue", "client"],
      ["export_evidence", "client"],
      ["export_evidence", "quantity_surveyor"],
      ["export_evidence", "engineer"],
    ];
    await tx
      .insert(authorityRules)
      .values(
        authority.map(([action, role]) => ({
          projectId: ids.project,
          action,
          role,
        })),
      );

    /* ───────────────────────────── milestones (escrow spine) ───────────────────────────── */
    const milestonePlan: Array<{
      sequence: number;
      code: string;
      name: string;
      amount: number;
    }> = [
      {
        sequence: 1,
        code: "M1",
        name: "Mobilisation & site possession",
        amount: 29_160_000,
      },
      {
        sequence: 2,
        code: "M2",
        name: "Substructure to ground floor slab",
        amount: 87_480_000,
      },
      {
        sequence: 3,
        code: "M3",
        name: "Structure — Blocks 1–3 to roof level",
        amount: 121_500_000,
      },
      {
        sequence: 4,
        code: "M4",
        name: "M&E rough-ins & roofing",
        amount: 87_480_000,
      },
      {
        sequence: 5,
        code: "M5",
        name: "Unit finishes — Blocks 1–3",
        amount: 72_900_000,
      },
      {
        sequence: 6,
        code: "M6",
        name: "Practical completion & handover",
        amount: 58_320_000,
      },
      {
        sequence: 7,
        code: "M7",
        name: "Defects liability release (6 months)",
        amount: 29_160_000,
      },
    ];
    await tx.insert(milestones).values(
      milestonePlan.map((m, i) => ({
        projectId: ids.project,
        sequence: m.sequence,
        code: m.code,
        name: m.name,
        amountMinor: toMinor(m.amount),
        status: (() => {
          let s:
            | "pending"
            | "in_progress"
            | "verified"
            | "certified"
            | "paid"
            | "locked" = "pending";
          if (i <= 3) s = "paid";
          if (i === 4) s = "certified";
          return s;
        })(),
      })),
    );

    /* ───────────────────────────── agreement (executed, JBC 1999) ───────────────────────────── */
    const clauses = [
      {
        sectionCode: "2.0",
        heading: "Scope of the Works",
        body: "The Contractor shall carry out and complete the construction of the project in accordance with the Contract Documents to the reasonable satisfaction of the Architect and the Employer.",
        status: "agreed",
      },
      {
        sectionCode: "6.1",
        heading: "Variations",
        body: "The Architect may issue instructions requiring a variation, the value of which shall be assessed on the basis of the Contract rates and prices where applicable, or fair valuation where not.",
        status: "disputed",
      },
      {
        sectionCode: "11.3",
        heading: "Interim Payments & Certificates",
        body: "The Quantity Surveyor shall value the work executed and materials on site at the end of each period and the Architect shall issue an Interim Certificate within the time stated, which the Employer shall pay within 30 days of issue.",
        status: "agreed",
      },
      {
        sectionCode: "17.0",
        heading: "Insurance",
        body: "The Contractor shall maintain all-risks insurance in joint names covering the works, materials and persons on site for the full contract value, evidenced annually.",
        status: "agreed",
      },
      {
        sectionCode: "27.0",
        heading: "Liquidated & Ascertained Damages",
        body: "If the Contractor fails to achieve practical completion by the date for completion, the Contractor shall pay liquidated damages at the rate in the Appendix, subject to a cap.",
        status: "agreed",
      },
    ] as const;

    const versionContent = clauses.map((c) => ({
      sectionCode: c.sectionCode,
      heading: c.heading,
      body: c.body,
    }));

    await tx.insert(agreements).values([
      {
        id: ids.agreement,
        projectId: ids.project,
        title: "Sakura Court Estate — Building Contract",
        form: "jbc_1999" as const,
        status: "executed" as const,
        currentVersionId: ids.agreementV1,
        createdBy: ids.muthoni,
      },
    ]);

    await tx.insert(agreementVersions).values([
      {
        id: ids.agreementV1,
        agreementId: ids.agreement,
        label: "v1.0",
        status: "executed" as const,
        contentHash: contentHash(versionContent),
        createdBy: ids.muthoni,
        executedAt: daysAgo(210),
      },
    ]);

    await tx.insert(agreementClauses).values(
      clauses.map((c, i) => ({
        agreementId: ids.agreement,
        versionId: ids.agreementV1,
        sectionCode: c.sectionCode,
        heading: c.heading,
        body: c.body,
        status: c.status as ClauseStatusValue,
        orderIndex: i + 1,
      })),
    );

    /* ───────────────────────────── variations ───────────────────────────── */
    await tx.insert(variations).values([
      {
        id: ids.var006,
        projectId: ids.project,
        agreementId: ids.agreement,
        reference: formatReference("VAR", 6),
        title: "Balcony glazing — Blocks 1–2",
        originatorId: ids.samuel,
        description:
          "Replace open balustrade with aluminium-framed glazed balcony screens to the 32 repeat units in Blocks 1–2, per instruction SI-042.",
        status: "executed" as const,
        claimedMinor: toMinor(14_200_000),
        assessedMinor: toMinor(12_700_000),
        committedMinor: toMinor(12_700_000),
        timeImpactDays: 21,
        taxIncluded: true,
        instructionRef: "SI-042",
        createdBy: ids.samuel,
      },
      {
        id: ids.var014,
        projectId: ids.project,
        agreementId: ids.agreement,
        reference: formatReference("VAR", 14),
        title: "Block 3 — living room flooring to natural stone",
        originatorId: ids.wanjiru,
        description:
          "Upgrade unit living-room flooring from ceramic to natural stone (Titanium/Maris Brown) across all 18 units in Block 3, per architectural instruction.",
        status: "under_review" as const,
        claimedMinor: toMinor(18_500_000),
        assessedMinor: toMinor(17_900_000),
        committedMinor: null,
        timeImpactDays: 0,
        taxIncluded: true,
        instructionRef: "AI-017",
        createdBy: ids.wanjiru,
      },
    ]);

    await tx.insert(variationReviews).values([
      {
        variationId: ids.var006,
        reviewerId: ids.samuel,
        type: "technical" as const,
        decision: "approved" as const,
        notes: "Glazing loads within transfer beam capacity.",
        assessedMinor: toMinor(14_200_000),
        createdAt: daysAgo(150, 11),
      },
      {
        variationId: ids.var006,
        reviewerId: ids.wambui,
        type: "commercial" as const,
        decision: "approved" as const,
        notes: "Rates benchmarked; glass cost renegotiated with supplier.",
        assessedMinor: toMinor(12_700_000),
        createdAt: daysAgo(149, 15),
      },
      {
        variationId: ids.var014,
        reviewerId: ids.samuel,
        type: "technical" as const,
        decision: "approved" as const,
        notes: "Slab load verified; stone thickness within allowance.",
        createdAt: daysAgo(6, 10),
      },
      {
        variationId: ids.var014,
        reviewerId: ids.wambui,
        type: "commercial" as const,
        decision: "approved" as const,
        notes: "Supplier quotation applied; packaging approved.",
        assessedMinor: toMinor(17_900_000),
        createdAt: daysAgo(5, 12),
      },
    ]);

    /* ───────────────────────────── payment flow: PC-004 → CERT-004 → payment ───────────────────────────── */
    await tx.insert(paymentClaims).values([
      {
        id: ids.claim004,
        projectId: ids.project,
        reference: formatReference("PC", 4),
        claimantId: ids.daniel,
        claimedMinor: toMinor(58_320_000),
        periodEnd: "2026-08-31",
        status: "certified" as const,
        submittedAt: daysAgo(34, 8),
      },
    ]);

    await tx.insert(valuations).values([
      {
        id: ids.valuation004,
        claimId: ids.claim004,
        valuerId: ids.wambui,
        assessedMinor: toMinor(56_900_000),
        notes:
          "Measured on site 2026-09-05; unfixed materials excluded pending M&E joinery.",
        createdAt: daysAgo(20, 14),
      },
    ]);

    await tx.insert(paymentCertificates).values([
      {
        id: ids.cert004,
        projectId: ids.project,
        claimId: ids.claim004,
        reference: formatReference("CERT", 4),
        certifiedMinor: toMinor(56_900_000),
        retentionMinor: toMinor(5_690_000),
        status: "issued" as const,
        issuedById: ids.wambui,
        issuedAt: daysAgo(15, 16),
        dueDate: "2026-10-16",
      },
    ]);

    await tx.insert(retentionEntries).values([
      {
        id: ids.cert004Retention,
        projectId: ids.project,
        certificateId: ids.cert004,
        amountMinor: toMinor(5_690_000),
        createdAt: daysAgo(15, 16),
      },
    ]);

    // Only KSh 40,000,000 recorded — 16.9M short of the certified amount.
    await tx.insert(paymentRecords).values([
      {
        id: ids.payment004,
        projectId: ids.project,
        certificateId: ids.cert004,
        amountMinor: toMinor(40_000_000),
        method: "rtgs" as const,
        externalReference: "RTGS-8841-SC",
        paidAt: "2026-10-02",
        recordedById: ids.muthoni,
      },
    ]);

    /* ───────────────────────────── issue (underpayment) ───────────────────────────── */
    await tx.insert(projectIssues).values([
      {
        id: ids.issue001,
        projectId: ids.project,
        reference: formatReference("ISS", 1),
        type: "payment" as const,
        title: "Cert. 004 underpayment — outstanding KSh 16.9M",
        description:
          "Interim Certificate 004 certified KSh 56,900,000.00. Only KSh 40,000,000.00 received on 2026-10-02. The balance of KSh 16,900,000.00 is 29 days past the payment due date.",
        reporterId: ids.daniel,
        severity: "critical" as const,
        status: "awaiting_response" as const,
        responsibleUserId: ids.muthoni,
        deadline: "2026-11-10",
      },
    ]);

    /* ───────────────────────────── instruction ───────────────────────────── */
    await tx.insert(instructions).values([
      {
        id: ids.invoice001,
        projectId: ids.project,
        reference: formatReference("SI", 42),
        title: "Balcony glazing to Blocks 1–2",
        body: "Proceed with glazed balcony screens as per drawing A-214 Rev C.",
        issuedById: ids.samuel,
        urgency: "urgent" as const,
        status: "acknowledged" as const,
        createdAt: daysAgo(160, 13),
      },
    ]);

    /* ───────────────────────────── append-only event ledger ───────────────────────────── */
    await tx.insert(projectEvents).values([
      {
        projectId: ids.project,
        actorId: ids.muthoni,
        actorRole: "client",
        eventType: "agreement_executed",
        entityType: "agreement",
        entityId: ids.agreement,
        summary:
          "Executed Sakura Court Building Contract (JBC 1999), sum KSh 486,000,000.00.",
        previousState: "ready_for_signature",
        resultingState: "executed",
        clauseRef: null,
        createdAt: daysAgo(210, 12),
      },
      {
        projectId: ids.project,
        actorId: ids.wambui,
        actorRole: "quantity_surveyor",
        eventType: "variation_executed",
        entityType: "variation",
        entityId: ids.var006,
        summary:
          "VAR-006 Balcony glazing committed at KSh 12,700,000.00 (+21 days).",
        previousState: "approved_pending_execution",
        resultingState: "executed",
        clauseRef: "6.1",
        createdAt: daysAgo(145, 10),
      },
      {
        projectId: ids.project,
        actorId: ids.wanjiru,
        actorRole: "lead_consultant",
        eventType: "variation_submitted",
        entityType: "variation",
        entityId: ids.var014,
        summary:
          "VAR-014 Block 3 flooring upgrade submitted for review (claimed KSh 18,500,000.00).",
        previousState: "draft",
        resultingState: "submitted",
        clauseRef: "6.1",
        createdAt: daysAgo(9, 9),
      },
      {
        projectId: ids.project,
        actorId: ids.wambui,
        actorRole: "quantity_surveyor",
        eventType: "variation_review_completed",
        entityType: "variation",
        entityId: ids.var014,
        summary:
          "VAR-014 commercial review approved at KSh 17,900,000.00; awaiting client authorization.",
        previousState: "under_review",
        resultingState: "under_review",
        clauseRef: "6.1",
        createdAt: daysAgo(5, 12),
      },
      {
        projectId: ids.project,
        actorId: ids.daniel,
        actorRole: "contractor",
        eventType: "claim_submitted",
        entityType: "payment_claim",
        entityId: ids.claim004,
        summary: "Interim claim PC-004 submitted, KSh 58,320,000.00.",
        previousState: "draft",
        resultingState: "submitted",
        clauseRef: "11.3",
        createdAt: daysAgo(34, 8),
      },
      {
        projectId: ids.project,
        actorId: ids.wambui,
        actorRole: "quantity_surveyor",
        eventType: "claim_assessed",
        entityType: "payment_claim",
        entityId: ids.claim004,
        summary: "PC-004 measured at KSh 56,900,000.00.",
        previousState: "under_assessment",
        resultingState: "assessed",
        clauseRef: "11.3",
        createdAt: daysAgo(20, 14),
      },
      {
        projectId: ids.project,
        actorId: ids.wambui,
        actorRole: "quantity_surveyor",
        eventType: "certificate_issued",
        entityType: "payment_certificate",
        entityId: ids.cert004,
        summary:
          "CERT-004 issued, KSh 56,900,000.00 (retention KSh 5,690,000.00); due 2026-10-16.",
        previousState: "draft",
        resultingState: "issued",
        clauseRef: "11.3",
        createdAt: daysAgo(15, 16),
      },
      {
        projectId: ids.project,
        actorId: ids.muthoni,
        actorRole: "client",
        eventType: "payment_recorded",
        entityType: "payment_record",
        entityId: ids.payment004,
        summary: "Recorded RTGS payment of KSh 40,000,000.00 against CERT-004.",
        previousState: null,
        resultingState: "recorded",
        clauseRef: "11.3",
        createdAt: daysAgo(9, 11),
      },
      {
        projectId: ids.project,
        actorId: ids.daniel,
        actorRole: "contractor",
        eventType: "issue_opened",
        entityType: "issue",
        entityId: ids.issue001,
        summary: "ISS-001 raised: CERT-004 underpaid by KSh 16,900,000.00.",
        previousState: null,
        resultingState: "awaiting_response",
        clauseRef: "11.3",
        createdAt: daysAgo(2, 8),
      },
    ]);

    /* ───────────────────────────── notifications ───────────────────────────── */
    await tx.insert(notifications).values([
      {
        userId: ids.muthoni,
        projectId: ids.project,
        type: "variation_awaiting_authorization",
        title: "VAR-014 ready for your authorization",
        body: "Commercial review approved at KSh 17,900,000.00. Sign to commit to the contract baseline.",
        status: "sent",
        relatedEntityType: "variation",
        relatedEntityId: ids.var014,
        createdAt: daysAgo(5, 12),
      },
      {
        userId: ids.muthoni,
        projectId: ids.project,
        type: "issue_assigned",
        title: "ISS-001 assigned to you",
        body: "Contractor reports CERT-004 underpayment of KSh 16,900,000.00.",
        status: "sent",
        relatedEntityType: "issue",
        relatedEntityId: ids.issue001,
        createdAt: daysAgo(2, 8),
      },
    ]);

    console.log("[seed] inserted Sakura Court demo project");
  });
}

main().catch((error: unknown) => {
  console.error(
    "[seed] failed:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});

import type { authorityAction, projectRole } from "@/db/schema";

export type ProjectRole = (typeof projectRole.enumValues)[number];
export type AuthorityAction = (typeof authorityAction.enumValues)[number];

/**
 * Default authority matrix. A project row in `authority_rules` overrides this
 * where present; otherwise these apply. Technical review and commercial
 * authorization are deliberately separate people/roles.
 */
export const DEFAULT_AUTHORITY: Record<
  AuthorityAction,
  readonly ProjectRole[]
> = {
  draft_clause: ["lead_consultant", "legal_adviser"],
  execute_agreement: ["client"],
  submit_variation: ["contractor", "lead_consultant", "engineer"],
  review_technical: ["engineer", "lead_consultant"],
  review_commercial: ["quantity_surveyor"],
  authorize_variation: ["client"],
  submit_claim: ["contractor"],
  assess_valuation: ["quantity_surveyor"],
  issue_certificate: ["quantity_surveyor", "lead_consultant"],
  record_payment: ["client"],
  resolve_issue: ["client", "project_manager", "lead_consultant"],
  export_evidence: [
    "client",
    "quantity_surveyor",
    "engineer",
    "lead_consultant",
  ],
};

interface AuthorityRule {
  action: AuthorityAction;
  role: ProjectRole;
}

/**
 * Resolves whether `roles` may perform `action`. Explicit `rules` (the project
 * matrix) take precedence over the default matrix, per action.
 */
export function can(
  roles: readonly ProjectRole[],
  action: AuthorityAction,
  rules: readonly AuthorityRule[] = [],
): boolean {
  const explicit = rules.filter((rule) => rule.action === action);
  const permittedRoles =
    explicit.length > 0
      ? explicit.map((rule) => rule.role)
      : DEFAULT_AUTHORITY[action];
  return roles.some((role) => permittedRoles.includes(role));
}

const ROLE_LABELS: Record<ProjectRole, string> = {
  client: "Client",
  contractor: "Contractor",
  lead_consultant: "Lead consultant",
  quantity_surveyor: "Quantity surveyor",
  engineer: "Engineer",
  project_manager: "Project manager",
  subcontractor: "Subcontractor",
  legal_adviser: "Legal adviser",
  dispute_professional: "Dispute professional",
  operations: "Operations",
  observer: "Observer",
};

export function roleLabel(role: ProjectRole): string {
  return ROLE_LABELS[role];
}

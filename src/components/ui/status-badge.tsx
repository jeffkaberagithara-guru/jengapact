import { cn } from "@/lib/cn";
import { Badge, type BadgeProps } from "./badge";

type Tone = NonNullable<BadgeProps["tone"]>;

interface StatusStyle {
  label: string;
  tone: Tone;
}

const STYLES: Record<string, StatusStyle> = {
  initiated: { label: "Initiated", tone: "neutral" },
  negotiate: { label: "Negotiate", tone: "info" },
  agree: { label: "Agree", tone: "info" },
  sign: { label: "Sign", tone: "warning" },
  build: { label: "Build", tone: "primary" },
  verify: { label: "Verify", tone: "info" },
  approve: { label: "Approve", tone: "warning" },
  pay: { label: "Pay", tone: "success" },
  closeout: { label: "Closeout", tone: "neutral" },

  draft: { label: "Draft", tone: "neutral" },
  submitted: { label: "Submitted", tone: "info" },
  under_review: { label: "Under review", tone: "warning" },
  under_assessment: { label: "Under assessment", tone: "warning" },
  changes_requested: { label: "Changes requested", tone: "warning" },
  rejected: { label: "Rejected", tone: "danger" },
  ready_for_authorization: {
    label: "Ready for authorization",
    tone: "warning",
  },
  approved_pending_execution: {
    label: "Approved, pending execution",
    tone: "warning",
  },
  executed: { label: "Executed", tone: "success" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
  assessed: { label: "Assessed", tone: "info" },
  certified: { label: "Certified", tone: "info" },
  issued: { label: "Issued", tone: "success" },
  superseded: { label: "Superseded", tone: "neutral" },

  pending: { label: "Pending", tone: "neutral" },
  in_progress: { label: "In progress", tone: "info" },
  verified: { label: "Verified", tone: "info" },
  paid: { label: "Paid", tone: "success" },
  locked: { label: "Locked", tone: "neutral" },

  open: { label: "Open", tone: "danger" },
  awaiting_response: { label: "Awaiting response", tone: "warning" },
  under_negotiation: { label: "Under negotiation", tone: "warning" },
  referred: { label: "Referred", tone: "info" },
  resolved: { label: "Resolved", tone: "success" },
  closed: { label: "Closed", tone: "neutral" },

  low: { label: "Low", tone: "neutral" },
  medium: { label: "Medium", tone: "info" },
  high: { label: "High", tone: "warning" },
  critical: { label: "Critical", tone: "danger" },
};

function humanize(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STYLES[status] ?? {
    label: humanize(status),
    tone: "neutral" as Tone,
  };
  return (
    <Badge tone={style.tone} className={cn(className)}>
      {style.label}
    </Badge>
  );
}

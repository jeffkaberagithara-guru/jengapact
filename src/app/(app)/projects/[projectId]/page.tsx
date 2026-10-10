import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EventList } from "@/components/app/event-list";
import { Money } from "@/components/app/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/date";
import {
  getProjectOverview,
  listEvents,
  listIssues,
  listMilestones,
  listVariations,
} from "@/modules/projects/queries";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const [overview, milestones, variations, issues, events] = await Promise.all([
    getProjectOverview(projectId),
    listMilestones(projectId),
    listVariations(projectId),
    listIssues(projectId),
    listEvents(projectId, 6),
  ]);

  const currency = overview.currency;
  const paidMilestones = milestones.filter(
    (milestone) => milestone.status === "paid" || milestone.status === "locked",
  ).length;
  const variationsInFlight = variations.filter(
    (row) =>
      row.variation.status !== "executed" &&
      row.variation.status !== "rejected" &&
      row.variation.status !== "withdrawn",
  );
  const openIssues = issues.filter((row) =>
    ["open", "awaiting_response", "under_negotiation", "referred"].includes(
      row.issue.status,
    ),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Contract value"
          value={
            <Money minor={overview.contractValueMinor} currency={currency} />
          }
          hint="Signed sum plus committed variations"
        />
        <Stat
          label="Certified"
          value={<Money minor={overview.certifiedMinor} currency={currency} />}
        />
        <Stat
          label="Paid"
          value={<Money minor={overview.paidMinor} currency={currency} />}
        />
        <Stat
          label="Outstanding"
          value={
            <Money minor={overview.outstandingMinor} currency={currency} />
          }
          hint={`${paidMilestones} of ${milestones.length} milestones paid`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Variations in flight</CardTitle>
            <Link
              href={`/projects/${projectId}/variations`}
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              All ({variations.length})
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {variationsInFlight.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No variations awaiting review or authorization.
              </p>
            ) : (
              variationsInFlight.map(({ variation }) => (
                <div
                  key={variation.id}
                  className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="tabular text-xs text-muted-foreground">
                      {variation.reference}
                    </span>
                    <span className="truncate text-sm font-medium">
                      {variation.title}
                    </span>
                  </div>
                  <StatusBadge status={variation.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Open issues</CardTitle>
            <Link
              href={`/projects/${projectId}/issues`}
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              All ({issues.length})
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {openIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No open issues. Nothing is waiting on a response.
              </p>
            ) : (
              openIssues.map(({ issue }) => (
                <div
                  key={issue.id}
                  className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="tabular text-xs text-muted-foreground">
                      {issue.reference}
                    </span>
                    <span className="truncate text-sm font-medium">
                      {issue.title}
                    </span>
                    {issue.deadline ? (
                      <span className="text-xs text-muted-foreground">
                        Due {formatDate(issue.deadline)}
                      </span>
                    ) : null}
                  </div>
                  <StatusBadge status={issue.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent activity</CardTitle>
          <Link
            href={`/projects/${projectId}/ledger`}
            className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
          >
            Full ledger
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </CardHeader>
        <CardContent>
          <EventList events={events} />
        </CardContent>
      </Card>
    </div>
  );
}

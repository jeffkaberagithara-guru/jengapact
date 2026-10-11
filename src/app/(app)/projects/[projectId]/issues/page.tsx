import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/date";
import { isOverdue } from "@/lib/date";
import { loadProjectActor } from "@/modules/access/context";
import { listIssues, listTeam } from "@/modules/projects/queries";
import { RaiseIssueForm } from "./raise-form";
import { ResolveIssueForm } from "./resolve-form";

const SEVERITY_TONE: Record<string, "neutral" | "info" | "warning" | "danger"> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "danger",
};

export default async function IssuesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [actor, rows, team] = await Promise.all([
    loadProjectActor(projectId),
    listIssues(projectId),
    listTeam(projectId),
  ]);
  const canResolve = actor?.can("resolve_issue") ?? false;
  const members = team.map((member) => ({
    userId: member.userId,
    fullName: member.fullName,
  }));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Raise an issue</CardTitle>
        </CardHeader>
        <CardContent>
          <RaiseIssueForm projectId={projectId} members={members} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No issues have been raised on this project.
            </div>
          ) : (
            <Table className="border-0">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Reference</TableHeaderCell>
                  <TableHeaderCell>Issue</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell>Severity</TableHeaderCell>
                  <TableHeaderCell>Responsible</TableHeaderCell>
                  <TableHeaderCell>Deadline</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(({ issue, responsibleName }) => {
                  const overdue =
                    issue.deadline !== null &&
                    issue.status !== "resolved" &&
                    issue.status !== "closed" &&
                    isOverdue(issue.deadline);
                  const resolvable =
                    canResolve &&
                    issue.status !== "resolved" &&
                    issue.status !== "closed";
                  return (
                    <TableRow key={issue.id}>
                      <TableCell className="tabular">{issue.reference}</TableCell>
                      <TableCell className="max-w-sm">
                        <span className="font-medium">{issue.title}</span>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {issue.description}
                        </p>
                        {resolvable ? (
                          <div className="mt-3">
                            <ResolveIssueForm projectId={projectId} issueId={issue.id} />
                          </div>
                        ) : null}
                        {issue.resolutionNote && issue.status !== "open" && issue.status !== "awaiting_response" && issue.status !== "under_negotiation" && issue.status !== "referred" ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Resolution: {issue.resolutionNote}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {issue.type}
                      </TableCell>
                      <TableCell>
                        <Badge tone={SEVERITY_TONE[issue.severity] ?? "neutral"}>
                          {issue.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {responsibleName ?? "—"}
                      </TableCell>
                      <TableCell>
                        {issue.deadline ? (
                          <span
                            className={overdue ? "text-danger" : "text-muted-foreground"}
                          >
                            {formatDate(issue.deadline)}
                            {overdue ? " · overdue" : ""}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={issue.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

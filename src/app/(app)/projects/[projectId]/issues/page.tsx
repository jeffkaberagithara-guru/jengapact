import { Badge } from "@/components/ui/badge";
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
import { listIssues } from "@/modules/projects/queries";

const SEVERITY_TONE: Record<string, "neutral" | "info" | "warning" | "danger"> =
  {
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
  const rows = await listIssues(projectId);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No issues have been raised on this project.
      </p>
    );
  }

  return (
    <Table>
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
          return (
            <TableRow key={issue.id}>
              <TableCell className="tabular">{issue.reference}</TableCell>
              <TableCell className="max-w-sm">
                <span className="font-medium">{issue.title}</span>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {issue.description}
                </p>
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
                    className={
                      overdue ? "text-danger" : "text-muted-foreground"
                    }
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
  );
}

import { Money } from "@/components/app/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { Stat } from "@/components/ui/stat";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/date";
import { loadProjectActor } from "@/modules/access/context";
import { getProjectById, listMilestones } from "@/modules/projects/queries";
import { MilestoneStatusForm } from "./status-form";

export default async function MilestonesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [actor, project, milestones] = await Promise.all([
    loadProjectActor(projectId),
    getProjectById(projectId),
    listMilestones(projectId),
  ]);
  const currency = project?.currency ?? "KES";
  const canUpdate = (actor?.can("issue_certificate") || actor?.can("record_payment")) ?? false;

  const total = milestones.reduce((sum, row) => sum + row.amountMinor, 0);
  const paid = milestones
    .filter((row) => row.status === "paid" || row.status === "locked")
    .reduce((sum, row) => sum + row.amountMinor, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Milestones" value={milestones.length} />
        <Stat
          label="Planned value"
          value={<Money minor={total} currency={currency} />}
        />
        <Stat
          label="Paid to date"
          value={<Money minor={paid} currency={currency} />}
        />
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>#</TableHeaderCell>
            <TableHeaderCell>Code</TableHeaderCell>
            <TableHeaderCell>Milestone</TableHeaderCell>
            <TableHeaderCell>Target</TableHeaderCell>
            <TableHeaderCell className="text-right">Amount</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            {canUpdate ? <TableHeaderCell>Actions</TableHeaderCell> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {milestones.map((milestone) => (
            <TableRow key={milestone.id}>
              <TableCell className="tabular text-muted-foreground">
                {milestone.sequence}
              </TableCell>
              <TableCell className="tabular">{milestone.code}</TableCell>
              <TableCell className="font-medium">{milestone.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {milestone.targetDate ? formatDate(milestone.targetDate) : "—"}
              </TableCell>
              <TableCell className="text-right">
                <Money minor={milestone.amountMinor} currency={currency} />
              </TableCell>
              <TableCell>
                <StatusBadge status={milestone.status} />
              </TableCell>
              {canUpdate ? (
                <TableCell>
                  <MilestoneStatusForm
                    projectId={projectId}
                    milestoneId={milestone.id}
                    currentStatus={milestone.status}
                  />
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

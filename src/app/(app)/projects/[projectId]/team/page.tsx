import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { loadProjectActor } from "@/modules/access/context";
import { roleLabel } from "@/modules/access/permissions";
import { listTeam } from "@/modules/projects/queries";
import { RoleForm } from "./role-form";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [actor, members] = await Promise.all([
    loadProjectActor(projectId),
    listTeam(projectId),
  ]);
  const canManage = actor?.can("resolve_issue") ?? false;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Email</TableHeaderCell>
          <TableHeaderCell>Organization</TableHeaderCell>
          <TableHeaderCell>Role</TableHeaderCell>
          {canManage ? <TableHeaderCell>Actions</TableHeaderCell> : null}
        </TableRow>
      </TableHead>
      <TableBody>
        {members.map((member) => (
          <TableRow key={`${member.userId}-${member.role}`}>
            <TableCell className="font-medium">{member.fullName}</TableCell>
            <TableCell className="text-muted-foreground">
              {member.email}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {member.organizationName ?? "—"}
            </TableCell>
            <TableCell>
              <Badge tone="outline">{roleLabel(member.role)}</Badge>
            </TableCell>
            {canManage ? (
              <TableCell>
                <RoleForm
                  projectId={projectId}
                  userId={member.userId}
                  currentRole={member.role}
                />
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

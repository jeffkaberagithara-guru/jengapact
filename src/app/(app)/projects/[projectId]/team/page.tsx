import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { roleLabel } from "@/modules/access/permissions";
import { listTeam } from "@/modules/projects/queries";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const members = await listTeam(projectId);

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Email</TableHeaderCell>
          <TableHeaderCell>Organization</TableHeaderCell>
          <TableHeaderCell>Role</TableHeaderCell>
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

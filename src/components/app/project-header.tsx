import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { roleLabel } from "@/modules/access/permissions";
import type { Project, ProjectRole } from "@/modules/projects/queries";
import { Money } from "./money";

interface ProjectHeaderProps {
  project: Project;
  roles: ProjectRole[];
}

export function ProjectHeader({ project, roles }: ProjectHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="tabular text-xs text-muted-foreground">
            {project.reference}
          </span>
          <StatusBadge status={project.stage} />
          {roles.map((role) => (
            <Badge key={role} tone="primary">
              {roleLabel(role)}
            </Badge>
          ))}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {project.name}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {project.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {project.location}
            </span>
          ) : null}
          {project.county ? <span>{project.county}</span> : null}
          {project.projectType ? <span>{project.projectType}</span> : null}
          {project.originalContractMinor !== null ? (
            <span className="inline-flex items-center gap-1">
              Contract{" "}
              <Money
                minor={project.originalContractMinor}
                currency={project.currency}
                compact
              />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

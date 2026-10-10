import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { roleLabel } from "@/modules/access/permissions";
import type { Project } from "@/modules/projects/queries";
import type { ProjectRole } from "@/modules/projects/queries";
import { Money } from "./money";

interface ProjectCardProps {
  project: Project;
  role: ProjectRole;
}

export function ProjectCard({ project, role }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`} className="group">
      <Card className="transition-colors group-hover:border-accent">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="tabular text-xs text-muted-foreground">
                {project.reference}
              </span>
              <h3 className="text-base font-semibold group-hover:text-accent">
                {project.name}
              </h3>
            </div>
            <StatusBadge status={project.stage} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {project.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {project.location}
              </span>
            ) : null}
            {project.county ? <span>{project.county}</span> : null}
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <Badge tone="outline">{roleLabel(role)}</Badge>
            <span className="text-sm">
              {project.originalContractMinor !== null ? (
                <Money
                  minor={project.originalContractMinor}
                  currency={project.currency}
                  compact
                />
              ) : (
                <span className="text-muted-foreground">
                  No contract sum yet
                </span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

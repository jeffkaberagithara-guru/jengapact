import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ProjectHeader } from "@/components/app/project-header";
import { ProjectTabs } from "@/components/app/project-tabs";
import { requireUser } from "@/modules/auth/server";
import { getProjectAccess } from "@/modules/projects/queries";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();
  const access = await getProjectAccess(projectId, user.id);

  if (!access) notFound();

  return (
    <div className="flex flex-col gap-6">
      <ProjectHeader project={access.project} roles={access.roles} />
      <ProjectTabs projectId={projectId} />
      <div className="pt-2">{children}</div>
    </div>
  );
}

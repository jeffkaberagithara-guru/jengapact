import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ProjectCard } from "@/components/app/project-card";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/cn";
import { requireUser } from "@/modules/auth/server";
import { joinDemoProjectAction } from "@/modules/projects/actions";
import {
  findProjectByReference,
  listMembershipsForUser,
} from "@/modules/projects/queries";

export const metadata: Metadata = {
  title: "Projects",
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const [{ error }, memberships, demo] = await Promise.all([
    searchParams,
    listMembershipsForUser(user.id),
    findProjectByReference("SC-2026-001"),
  ]);

  const hasDemoAccess = memberships.some(
    (membership) => membership.project.id === demo?.id,
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Projects"
        description="Every project you are party to, and the role you hold on it."
        actions={
          <Link
            href="/projects/new"
            className={cn(buttonVariants({ variant: "primary" }))}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New project
          </Link>
        }
      />

      {error === "demo-unavailable" ? (
        <Alert tone="warning">
          The Sakura Court demo project is not available in this environment.
        </Alert>
      ) : null}

      {memberships.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create a project to begin, or open the Sakura Court demo."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/projects/new"
                className={cn(buttonVariants({ variant: "primary" }))}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New project
              </Link>
              {demo ? (
                <form action={joinDemoProjectAction}>
                  <Button type="submit" variant="outline">
                    Open demo
                  </Button>
                </form>
              ) : null}
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {memberships.map((membership) => (
            <ProjectCard
              key={`${membership.project.id}-${membership.role}`}
              project={membership.project}
              role={membership.role}
            />
          ))}
        </div>
      )}

      {demo && !hasDemoAccess && memberships.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Explore the Sakura Court demo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm text-muted-foreground">
              Join as an observer to read a complete build-stage record.
            </p>
            <form action={joinDemoProjectAction} className="shrink-0">
              <Button type="submit" variant="outline">
                Open demo
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

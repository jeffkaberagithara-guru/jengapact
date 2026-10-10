import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Money } from "@/components/app/money";
import { ProjectCard } from "@/components/app/project-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Stat } from "@/components/ui/stat";
import { cn } from "@/lib/cn";
import { getDomainUser } from "@/modules/auth/user";
import { requireUser } from "@/modules/auth/server";
import { joinDemoProjectAction } from "@/modules/projects/actions";
import {
  findProjectByReference,
  listMembershipsForUser,
} from "@/modules/projects/queries";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const [profile, memberships, demo] = await Promise.all([
    getDomainUser(user.id),
    listMembershipsForUser(user.id),
    findProjectByReference("SC-2026-001"),
  ]);

  const firstName = (profile?.fullName ?? user.name ?? "there").split(" ")[0];
  const hasDemoAccess = memberships.some(
    (membership) => membership.project.id === demo?.id,
  );
  const contractTotal = memberships.reduce(
    (total, membership) =>
      total + (membership.project.originalContractMinor ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Karibu, ${firstName}`}
        description="Your projects, their current stage, and what needs a decision."
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Projects" value={memberships.length} />
        <Stat
          label="Contract value"
          value={<Money minor={contractTotal} compact />}
          hint="Across projects you are on"
        />
        <Stat
          label="Needs attention"
          value={memberships.length === 0 ? "—" : "Open a project"}
          hint="Variations, certs and issues live inside"
        />
      </div>

      {memberships.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project, or open the Sakura Court demo to see a live build-stage record end to end."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/projects/new"
                className={cn(buttonVariants({ variant: "primary" }))}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New project
              </Link>
              {demo && !hasDemoAccess ? (
                <form action={joinDemoProjectAction}>
                  <Button type="submit" variant="outline">
                    Open Sakura Court demo
                  </Button>
                </form>
              ) : null}
            </div>
          }
        />
      ) : (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent projects</h2>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {memberships.slice(0, 4).map((membership) => (
              <ProjectCard
                key={`${membership.project.id}-${membership.role}`}
                project={membership.project}
                role={membership.role}
              />
            ))}
          </div>
        </section>
      )}

      {demo && !hasDemoAccess && memberships.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Explore the Sakura Court demo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm text-muted-foreground">
              A live build-stage project with an executed variation, a variation
              under review, a certified payment that was underpaid, and the
              ledger tying it together. Join as an observer.
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

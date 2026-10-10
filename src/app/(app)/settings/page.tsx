import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/modules/auth/server";
import { getDomainUser } from "@/modules/auth/user";
import { listOrganizationsForUser } from "@/modules/projects/queries";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await requireUser();
  const [profile, organizations] = await Promise.all([
    getDomainUser(user.id),
    listOrganizationsForUser(user.id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Settings"
        description="Your profile is derived from your account and the projects you belong to."
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Identity shared with your project teams.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Full name</dt>
              <dd className="mt-1 text-sm font-medium">
                {profile?.fullName ?? user.name ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="mt-1 text-sm font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Job title</dt>
              <dd className="mt-1 text-sm font-medium">
                {profile?.jobTitle ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Phone</dt>
              <dd className="mt-1 text-sm font-medium">
                {profile?.phone ?? "—"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>
            You hold authority within a project through an organization and a
            role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You are not yet part of an organization. Creating a project adds
              you as the client.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {organizations.map((organization) => (
                <li
                  key={organization.id}
                  className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0 last:pb-0"
                >
                  <span className="font-medium">{organization.name}</span>
                  <span className="capitalize text-muted-foreground">
                    {organization.role}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

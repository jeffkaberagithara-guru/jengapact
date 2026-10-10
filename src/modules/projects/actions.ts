"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import {
  authorityRules,
  projectEvents,
  projectMemberships,
  projects,
} from "@/db/schema";
import { newId } from "@/lib/ids";
import { parseAmountToMinor } from "@/lib/money";
import {
  DEFAULT_AUTHORITY,
  type AuthorityAction,
} from "@/modules/access/permissions";
import { requireUser } from "@/modules/auth/server";
import { createDomainUser } from "@/modules/auth/user";
import { findProjectByReference } from "./queries";

export interface ProjectFormState {
  error?: string;
}

const DEMO_PROJECT_REFERENCE = "SC-2026-001";

const createSchema = z.object({
  name: z.string().trim().min(3, "Project name must be at least 3 characters"),
  location: z.string().trim().optional(),
  county: z.string().trim().optional(),
  projectType: z.string().trim().optional(),
  contractSum: z.string().trim().optional(),
});

function generateReference(): string {
  const suffix = newId().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `PRJ-${suffix}`;
}

async function ensureDomainUser(user: {
  id: string;
  name: string;
  email: string;
}): Promise<void> {
  await createDomainUser({
    id: user.id,
    fullName: user.name || user.email,
    email: user.email,
  });
}

export async function createProjectAction(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const user = await requireUser();

  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;

  let originalContractMinor: number | null = null;
  if (data.contractSum) {
    originalContractMinor = parseAmountToMinor(data.contractSum);
    if (originalContractMinor === null) {
      return { error: "Contract sum must be a valid amount, e.g. 486,000,000" };
    }
  }

  await ensureDomainUser(user);

  const projectId = await db.transaction(async (tx) => {
    const [project] = await tx
      .insert(projects)
      .values({
        reference: generateReference(),
        name: data.name,
        location: data.location || null,
        county: data.county || null,
        projectType: data.projectType || null,
        stage: "initiated",
        originalContractMinor,
        createdBy: user.id,
      })
      .returning({ id: projects.id });

    if (!project) throw new Error("Failed to create project");

    await tx
      .insert(projectMemberships)
      .values({ projectId: project.id, userId: user.id, role: "client" });

    const actions = Object.keys(DEFAULT_AUTHORITY) as AuthorityAction[];
    const ruleRows = actions.flatMap((action) =>
      DEFAULT_AUTHORITY[action].map((role) => ({
        projectId: project.id,
        action,
        role,
      })),
    );
    if (ruleRows.length > 0) {
      await tx.insert(authorityRules).values(ruleRows);
    }

    await tx.insert(projectEvents).values({
      projectId: project.id,
      actorId: user.id,
      actorRole: "client",
      eventType: "project_created",
      entityType: "project",
      entityId: project.id,
      summary: `Project "${data.name}" created.`,
      resultingState: "initiated",
    });

    return project.id;
  });

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  redirect(`/projects/${projectId}`);
}

export async function joinDemoProjectAction(): Promise<void> {
  const user = await requireUser();
  await ensureDomainUser(user);

  const project = await findProjectByReference(DEMO_PROJECT_REFERENCE);
  if (!project) {
    redirect("/projects?error=demo-unavailable");
  }

  await db
    .insert(projectMemberships)
    .values({ projectId: project.id, userId: user.id, role: "observer" })
    .onConflictDoNothing();

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

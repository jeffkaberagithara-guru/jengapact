import "server-only";
import { requireUser } from "@/modules/auth/server";
import { getProjectAccess, type ProjectAccess } from "@/modules/projects/queries";
import { can, type AuthorityAction } from "./permissions";

export interface ProjectActor {
  userId: string;
  email: string;
  access: ProjectAccess;
  /** Whether this actor may perform `action` on the project, given its rules. */
  can: (action: AuthorityAction) => boolean;
}

/**
 * Resolves the current user's actor context for a project. Returns null when the
 * user is not a member, so callers can distinguish "no access" from "no
 * authority" without leaking either.
 */
export async function loadProjectActor(
  projectId: string,
): Promise<ProjectActor | null> {
  const user = await requireUser();
  const access = await getProjectAccess(projectId, user.id);
  if (!access) return null;

  return {
    userId: user.id,
    email: user.email,
    access,
    can: (action) => can(access.roles, action, access.rules),
  };
}

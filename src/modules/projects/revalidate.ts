import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Invalidates every project-scoped view a mutation can appear in. Paths are
 * listed explicitly because `revalidatePath` revalidates the exact path it is
 * given, not the subtree beneath it.
 */
export function revalidateProject(projectId: string): void {
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/milestones`);
  revalidatePath(`/projects/${projectId}/variations`);
  revalidatePath(`/projects/${projectId}/payments`);
  revalidatePath(`/projects/${projectId}/issues`);
  revalidatePath(`/projects/${projectId}/ledger`);
}

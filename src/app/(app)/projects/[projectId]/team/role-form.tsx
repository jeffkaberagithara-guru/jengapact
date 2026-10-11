"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  initialTeamState,
  updateMemberRoleAction,
} from "@/modules/team/actions";

const ROLES = [
  "client",
  "contractor",
  "lead_consultant",
  "quantity_surveyor",
  "engineer",
  "project_manager",
  "subcontractor",
  "legal_adviser",
  "dispute_professional",
  "operations",
  "observer",
] as const;

export function RoleForm({
  projectId,
  userId,
  currentRole,
}: {
  projectId: string;
  userId: string;
  currentRole: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateMemberRoleAction,
    initialTeamState,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="userId" value={userId} />
      <select
        name="role"
        defaultValue={currentRole}
        className="h-8 rounded-md border border-input bg-surface px-2 text-xs"
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
      {state.error ? <span className="text-xs text-danger">{state.error}</span> : null}
      {state.success ? <span className="text-xs text-success">{state.success}</span> : null}
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  initialMilestoneState,
  updateMilestoneStatusAction,
} from "@/modules/milestones/actions";

const STATUSES = [
  "pending",
  "in_progress",
  "verified",
  "certified",
  "paid",
  "locked",
] as const;

export function MilestoneStatusForm({
  projectId,
  milestoneId,
  currentStatus,
}: {
  projectId: string;
  milestoneId: string;
  currentStatus: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateMilestoneStatusAction,
    initialMilestoneState,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="milestoneId" value={milestoneId} />
      <select
        name="status"
        defaultValue={currentStatus}
        className="h-8 rounded-md border border-input bg-surface px-2 text-xs"
      >
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Update"}
      </Button>
      {state.error ? <span className="text-xs text-danger">{state.error}</span> : null}
      {state.success ? <span className="text-xs text-success">{state.success}</span> : null}
    </form>
  );
}

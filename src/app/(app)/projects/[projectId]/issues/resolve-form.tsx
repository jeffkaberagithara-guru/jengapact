"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import {
  initialIssueState,
  resolveIssueAction,
} from "@/modules/issues/actions";

export function ResolveIssueForm({
  projectId,
  issueId,
}: {
  projectId: string;
  issueId: string;
}) {
  const [state, formAction, pending] = useActionState(
    resolveIssueAction,
    initialIssueState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-md border border-border p-3" noValidate>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="issueId" value={issueId} />
      <div className="text-xs font-medium text-muted-foreground">Resolve issue</div>
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <Field label="Resolution note" htmlFor={`resolution-${issueId}`}>
        <Textarea
          id={`resolution-${issueId}`}
          name="resolutionNote"
          placeholder="What was agreed and how it was resolved?"
        />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" size="sm" variant="accent" disabled={pending}>
          {pending ? "Resolving…" : "Mark resolved"}
        </Button>
      </div>
    </form>
  );
}

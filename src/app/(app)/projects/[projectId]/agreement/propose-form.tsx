"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import {
  initialAgreementState,
  proposeClauseChangeAction,
} from "@/modules/agreements/actions";

export function ProposeClauseForm({
  projectId,
  clauseId,
}: {
  projectId: string;
  clauseId: string;
}) {
  const [state, formAction, pending] = useActionState(
    proposeClauseChangeAction,
    initialAgreementState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-md border border-border p-3" noValidate>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="clauseId" value={clauseId} />
      <div className="text-xs font-medium text-muted-foreground">Propose change</div>
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <Field label="Proposed text" htmlFor={`proposed-${clauseId}`}>
        <Textarea id={`proposed-${clauseId}`} name="proposedBody" />
      </Field>
      <Field label="Justification" htmlFor={`just-${clauseId}`} hint="Optional">
        <Textarea id={`just-${clauseId}`} name="justification" />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Submitting…" : "Submit proposal"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  acceptClauseProposalAction,
  initialAgreementState,
} from "@/modules/agreements/actions";

export function AcceptClauseForm({
  projectId,
  clauseId,
}: {
  projectId: string;
  clauseId: string;
}) {
  const [state, formAction, pending] = useActionState(
    acceptClauseProposalAction,
    initialAgreementState,
  );

  return (
    <form action={formAction} className="flex items-center gap-2" noValidate>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="clauseId" value={clauseId} />
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <Button type="submit" size="sm" variant="accent" disabled={pending}>
        {pending ? "Accepting…" : "Mark agreed"}
      </Button>
    </form>
  );
}

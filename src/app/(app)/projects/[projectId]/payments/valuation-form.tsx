"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import {
  initialPaymentState,
  recordValuationAction,
} from "@/modules/payments/actions";

export function ValuationForm({
  projectId,
  claimId,
}: {
  projectId: string;
  claimId: string;
}) {
  const [state, formAction, pending] = useActionState(
    recordValuationAction,
    initialPaymentState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-md border border-border p-3" noValidate>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="claimId" value={claimId} />
      <div className="text-xs font-medium text-muted-foreground">Record valuation</div>
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <Field label="Assessed amount (KES)" htmlFor={`assessed-${claimId}`}>
        <Input id={`assessed-${claimId}`} name="assessed" inputMode="decimal" placeholder="56,900,000" />
      </Field>
      <Field label="Notes" htmlFor={`notes-${claimId}`}>
        <Textarea id={`notes-${claimId}`} name="notes" placeholder="Measurement notes" />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Record valuation"}
        </Button>
      </div>
    </form>
  );
}

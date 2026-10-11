"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  initialPaymentState,
  submitClaimAction,
} from "@/modules/payments/actions";

export function ClaimForm({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(
    submitClaimAction,
    initialPaymentState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="projectId" value={projectId} />
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Claimed amount (KES)" htmlFor="claimed">
          <Input id="claimed" name="claimed" inputMode="decimal" placeholder="58,320,000" />
        </Field>
        <Field label="Period end" htmlFor="periodEnd" hint="YYYY-MM-DD (optional)">
          <Input id="periodEnd" name="periodEnd" type="date" />
        </Field>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Submitting…" : "Submit claim"}
        </Button>
      </div>
    </form>
  );
}

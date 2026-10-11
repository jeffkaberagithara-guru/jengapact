"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  initialPaymentState,
  issueCertificateAction,
} from "@/modules/payments/actions";

export function CertificateForm({
  projectId,
  claimId,
}: {
  projectId: string;
  claimId: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    issueCertificateAction,
    initialPaymentState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-md border border-border p-3" noValidate>
      <input type="hidden" name="projectId" value={projectId} />
      {claimId ? <input type="hidden" name="claimId" value={claimId} /> : null}
      <div className="text-xs font-medium text-muted-foreground">Issue payment certificate</div>
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Certified (KES)" htmlFor="certified">
          <Input id="certified" name="certified" inputMode="decimal" placeholder="56,900,000" />
        </Field>
        <Field label="Retention (KES)" htmlFor="retention" hint="Default 0">
          <Input id="retention" name="retention" inputMode="decimal" placeholder="0" />
        </Field>
        <Field label="Due date" htmlFor="dueDate" hint="YYYY-MM-DD">
          <Input id="dueDate" name="dueDate" type="date" />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" variant="accent" disabled={pending}>
          {pending ? "Issuing…" : "Issue certificate"}
        </Button>
      </div>
    </form>
  );
}

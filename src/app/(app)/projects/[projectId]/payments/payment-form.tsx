"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  initialPaymentState,
  recordPaymentAction,
} from "@/modules/payments/actions";

export function PaymentForm({
  projectId,
  certificates,
}: {
  projectId: string;
  certificates: Array<{ id: string; reference: string }>;
}) {
  const [state, formAction, pending] = useActionState(
    recordPaymentAction,
    initialPaymentState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-md border border-border p-3" noValidate>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="text-xs font-medium text-muted-foreground">Record payment</div>
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Certificate (optional)" htmlFor="certificateId">
          <select
            id="certificateId"
            name="certificateId"
            className="h-10 w-full rounded-md border border-input bg-surface px-3 text-sm"
          >
            <option value="">No certificate</option>
            {certificates.map((cert) => (
              <option key={cert.id} value={cert.id}>
                {cert.reference}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Amount (KES)" htmlFor="amount">
          <Input id="amount" name="amount" inputMode="decimal" placeholder="40,000,000" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Method" htmlFor="method">
          <select
            id="method"
            name="method"
            className="h-10 w-full rounded-md border border-input bg-surface px-3 text-sm"
            defaultValue="rtgs"
          >
            <option value="rtgs">RTGS</option>
            <option value="pesalink">Pesalink</option>
            <option value="mpesa_b2b">M-Pesa B2B</option>
            <option value="cheque">Cheque</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Bank/reference" htmlFor="externalReference" hint="Optional">
          <Input id="externalReference" name="externalReference" placeholder="RTGS-8841-SC" />
        </Field>
        <Field label="Paid at" htmlFor="paidAt" hint="YYYY-MM-DD">
          <Input id="paidAt" name="paidAt" type="date" />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Recording…" : "Record payment"}
        </Button>
      </div>
    </form>
  );
}

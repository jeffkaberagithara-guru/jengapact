"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import {
  initialVariationState,
  raiseVariationAction,
} from "@/modules/variations/actions";

export function RaiseVariationForm({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(
    raiseVariationAction,
    initialVariationState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="projectId" value={projectId} />
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Field label="Title" htmlFor="title">
        <Input id="title" name="title" placeholder="Balcony glazing upgrade" />
      </Field>

      <Field label="Description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          placeholder="Describe the scope, reason for change, and what will be affected."
        />
      </Field>

      <Field
        label="Claimed amount (KES)"
        htmlFor="claimed"
        hint="Enter the contractor’s claimed amount, e.g. 14,200,000"
      >
        <Input id="claimed" name="claimed" inputMode="decimal" placeholder="14,200,000" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Time impact (days)" htmlFor="timeImpactDays" hint="Zero if no delay">
          <Input id="timeImpactDays" name="timeImpactDays" type="number" min={0} defaultValue={0} />
        </Field>
        <Field label="Tax included" htmlFor="taxIncluded" hint="Leave unchecked if VAT/excise is added separately">
          <div className="flex h-10 items-center gap-2">
            <input id="taxIncluded" name="taxIncluded" type="checkbox" className="h-4 w-4 rounded border-border" />
            <label htmlFor="taxIncluded" className="text-sm text-muted-foreground">
              Claimed amount is tax-inclusive
            </label>
          </div>
        </Field>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Raise variation"}
      </Button>
    </form>
  );
}

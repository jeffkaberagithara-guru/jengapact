"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import {
  initialVariationState,
  reviewVariationAction,
} from "@/modules/variations/actions";

export function ReviewVariationForm({
  projectId,
  variationId,
  type,
}: {
  projectId: string;
  variationId: string;
  type: "technical" | "commercial";
}) {
  const [state, formAction, pending] = useActionState(
    reviewVariationAction,
    initialVariationState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-md border border-border p-3" noValidate>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="variationId" value={variationId} />
      <input type="hidden" name="type" value={type} />

      <div className="text-xs font-medium text-muted-foreground capitalize">
        Record {type} review
      </div>

      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Field label="Decision" htmlFor={`${type}-decision-${variationId}`}>
        <select
          id={`${type}-decision-${variationId}`}
          name="decision"
          className="h-10 w-full rounded-md border border-input bg-surface px-3 text-sm"
          defaultValue="approved"
        >
          <option value="approved">Approved</option>
          <option value="changes_requested">Changes requested</option>
          <option value="rejected">Rejected</option>
          <option value="noted">Noted</option>
        </select>
      </Field>

      {type === "commercial" ? (
        <Field
          label="Assessed amount (KES)"
          htmlFor={`${type}-assessed-${variationId}`}
          hint="Only the commercial reviewer sets the assessed value"
        >
          <Input
            id={`${type}-assessed-${variationId}`}
            name="assessed"
            inputMode="decimal"
            placeholder="17,900,000"
          />
        </Field>
      ) : null}

      <Field label="Notes" htmlFor={`${type}-notes-${variationId}`}>
        <Textarea
          id={`${type}-notes-${variationId}`}
          name="notes"
          placeholder="Brief justification for the decision"
        />
      </Field>

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Record review"}
        </Button>
      </div>
    </form>
  );
}

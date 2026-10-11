"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  authorizeVariationAction,
  initialVariationState,
} from "@/modules/variations/actions";

export function AuthorizeVariationForm({
  projectId,
  variationId,
}: {
  projectId: string;
  variationId: string;
}) {
  const [state, formAction, pending] = useActionState(
    authorizeVariationAction,
    initialVariationState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2" noValidate>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="variationId" value={variationId} />
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <Button type="submit" size="sm" disabled={pending} variant="accent">
        {pending ? "Authorizing…" : "Authorize & commit"}
      </Button>
    </form>
  );
}

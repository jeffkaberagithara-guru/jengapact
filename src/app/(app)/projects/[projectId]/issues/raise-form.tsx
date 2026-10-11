"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import {
  initialIssueState,
  raiseIssueAction,
} from "@/modules/issues/actions";

export function RaiseIssueForm({
  projectId,
  members,
}: {
  projectId: string;
  members: Array<{ userId: string; fullName: string }>;
}) {
  const [state, formAction, pending] = useActionState(
    raiseIssueAction,
    initialIssueState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="projectId" value={projectId} />
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type" htmlFor="issue-type">
          <select
            id="issue-type"
            name="type"
            className="h-10 w-full rounded-md border border-input bg-surface px-3 text-sm"
            defaultValue="payment"
          >
            <option value="scope">Scope</option>
            <option value="payment">Payment</option>
            <option value="delay">Delay</option>
            <option value="quality">Quality</option>
            <option value="defect">Defect</option>
            <option value="safety">Safety</option>
            <option value="instruction">Instruction</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Severity" htmlFor="severity">
          <select
            id="severity"
            name="severity"
            className="h-10 w-full rounded-md border border-input bg-surface px-3 text-sm"
            defaultValue="medium"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </Field>
      </div>

      <Field label="Title" htmlFor="issue-title">
        <Input id="issue-title" name="title" placeholder="CERT-004 underpayment" />
      </Field>

      <Field label="Description" htmlFor="issue-description">
        <Textarea
          id="issue-description"
          name="description"
          placeholder="What is the issue? When did it occur? What evidence exists?"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Responsible" htmlFor="responsibleUserId" hint="Assign to a team member (optional)">
          <select
            id="responsibleUserId"
            name="responsibleUserId"
            className="h-10 w-full rounded-md border border-input bg-surface px-3 text-sm"
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.fullName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Deadline" htmlFor="deadline" hint="YYYY-MM-DD (optional)">
          <Input id="deadline" name="deadline" type="date" />
        </Field>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Raising…" : "Raise issue"}
      </Button>
    </form>
  );
}

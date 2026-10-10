"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createProjectAction,
  type ProjectFormState,
} from "@/modules/projects/actions";

const initialState: ProjectFormState = {};

export function NewProjectForm() {
  const [state, formAction, pending] = useActionState(
    createProjectAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <Field label="Project name" htmlFor="name">
        <Input
          id="name"
          name="name"
          required
          placeholder="Sakura Court Estate — Mirema"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Location" htmlFor="location">
          <Input
            id="location"
            name="location"
            placeholder="Mirema, Kiambu Road"
          />
        </Field>
        <Field label="County" htmlFor="county">
          <Input id="county" name="county" placeholder="Kiambu" />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Project type" htmlFor="projectType">
          <Input
            id="projectType"
            name="projectType"
            placeholder="Residential — 68 units"
          />
        </Field>
        <Field
          label="Contract sum (KES)"
          htmlFor="contractSum"
          hint="Optional. Leave blank until an agreement is executed."
        >
          <Input
            id="contractSum"
            name="contractSum"
            inputMode="decimal"
            placeholder="486,000,000"
          />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create project"}
        </Button>
      </div>
    </form>
  );
}

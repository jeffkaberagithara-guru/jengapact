import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { NewProjectForm } from "./new-project-form";

export const metadata: Metadata = {
  title: "New project",
};

export default function NewProjectPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="New project"
        description="Start the record. You become the client on this project, and the default authority matrix is applied."
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Project details</CardTitle>
          <CardDescription>
            You can add an agreement, milestones and parties later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewProjectForm />
        </CardContent>
      </Card>
    </div>
  );
}

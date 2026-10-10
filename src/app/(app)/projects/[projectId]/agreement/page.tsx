import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/date";
import { getAgreement } from "@/modules/projects/queries";

const FORM_LABELS: Record<string, string> = {
  jbc_1999: "JBC 1999",
  fidic_2017_red: "FIDIC 2017 Red Book",
  fidic_2017_yellow: "FIDIC 2017 Yellow Book",
  bespoke: "Bespoke",
};

export default async function AgreementPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const view = await getAgreement(projectId);

  if (!view) {
    return (
      <p className="text-sm text-muted-foreground">
        No agreement has been recorded on this project yet.
      </p>
    );
  }

  const { agreement, version, clauses } = view;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>{agreement.title}</CardTitle>
            <StatusBadge status={agreement.status} />
          </div>
          <CardDescription>
            {FORM_LABELS[agreement.form] ?? agreement.form}
            {version ? ` · ${version.label}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {version ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>Version status: {version.status.replace(/_/g, " ")}</span>
              {version.executedAt ? (
                <span>Executed {formatDateTime(version.executedAt)}</span>
              ) : null}
            </div>
          ) : null}
          {version ? (
            <div className="flex flex-col gap-1 rounded-md border border-border bg-muted p-3">
              <span className="text-xs font-medium text-muted-foreground">
                Content hash (SHA-256)
              </span>
              <span className="tabular text-xs break-all">
                {version.contentHash}
              </span>
              <span className="text-xs text-muted-foreground">
                A matching hash shows the clause text is unchanged. It does not
                prove authorship or legal validity.
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {clauses.map((clause) => (
          <Card key={clause.id}>
            <CardContent className="flex flex-col gap-2 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="tabular text-xs text-muted-foreground">
                    {clause.sectionCode}
                  </span>
                  <h3 className="text-sm font-semibold">{clause.heading}</h3>
                </div>
                <Badge
                  tone={clause.status === "disputed" ? "danger" : "neutral"}
                >
                  {clause.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{clause.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Money } from "@/components/app/money";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/date";
import { getProjectById, listVariations } from "@/modules/projects/queries";

function decisionIcon(decision: string) {
  if (decision === "approved") {
    return <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />;
  }
  if (decision === "rejected") {
    return <XCircle className="h-4 w-4 text-danger" aria-hidden="true" />;
  }
  return <Clock className="h-4 w-4 text-warning" aria-hidden="true" />;
}

export default async function VariationsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [project, rows] = await Promise.all([
    getProjectById(projectId),
    listVariations(projectId),
  ]);
  const currency = project?.currency ?? "KES";

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No variations have been raised on this project.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {rows.map(({ variation, originatorName, reviews }) => (
        <Card key={variation.id}>
          <CardContent className="flex flex-col gap-5 p-5">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="tabular text-xs text-muted-foreground">
                  {variation.reference}
                </span>
                <StatusBadge status={variation.status} />
                {variation.instructionRef ? (
                  <Badge tone="outline">
                    Instruction {variation.instructionRef}
                  </Badge>
                ) : null}
              </div>
              <h2 className="text-base font-semibold">{variation.title}</h2>
              <p className="max-w-3xl text-sm text-muted-foreground">
                {variation.description}
              </p>
              <p className="text-xs text-muted-foreground">
                Raised by {originatorName ?? "—"}
                {variation.timeImpactDays > 0
                  ? ` · ${variation.timeImpactDays} days time impact`
                  : ""}
                {variation.taxIncluded ? " · tax inclusive" : ""}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-border p-3">
                <span className="text-xs text-muted-foreground">Claimed</span>
                <p className="mt-1 font-medium">
                  <Money minor={variation.claimedMinor} currency={currency} />
                </p>
              </div>
              <div className="rounded-md border border-border p-3">
                <span className="text-xs text-muted-foreground">Assessed</span>
                <p className="mt-1 font-medium">
                  {variation.assessedMinor !== null ? (
                    <Money
                      minor={variation.assessedMinor}
                      currency={currency}
                    />
                  ) : (
                    <span className="text-muted-foreground">Not yet</span>
                  )}
                </p>
              </div>
              <div className="rounded-md border border-border p-3">
                <span className="text-xs text-muted-foreground">Committed</span>
                <p className="mt-1 font-medium">
                  {variation.committedMinor !== null ? (
                    <Money
                      minor={variation.committedMinor}
                      currency={currency}
                    />
                  ) : (
                    <span className="text-muted-foreground">Not committed</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Reviews
              </h3>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No reviews recorded yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {reviews.map(({ review, reviewerName }) => (
                    <li key={review.id} className="flex gap-3">
                      <span className="mt-0.5">
                        {decisionIcon(review.decision)}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm">
                          <span className="font-medium capitalize">
                            {review.type}
                          </span>{" "}
                          review ·{" "}
                          <span className="capitalize">
                            {review.decision.replace(/_/g, " ")}
                          </span>{" "}
                          by {reviewerName ?? "—"}
                        </span>
                        {review.notes ? (
                          <span className="text-sm text-muted-foreground">
                            {review.notes}
                          </span>
                        ) : null}
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(review.createdAt)}
                          {review.assessedMinor !== null ? (
                            <>
                              {" "}
                              · assessed{" "}
                              <Money
                                minor={review.assessedMinor}
                                currency={currency}
                              />
                            </>
                          ) : null}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

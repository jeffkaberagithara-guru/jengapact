import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Money } from "@/components/app/money";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/date";
import { loadProjectActor } from "@/modules/access/context";
import { getProjectById, listVariations } from "@/modules/projects/queries";
import { AuthorizeVariationForm } from "./authorize-form";
import { RaiseVariationForm } from "./raise-form";
import { ReviewVariationForm } from "./review-form";

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
  const [actor, project, rows] = await Promise.all([
    loadProjectActor(projectId),
    getProjectById(projectId),
    listVariations(projectId),
  ]);
  const currency = project?.currency ?? "KES";
  const canSubmit = actor?.can("submit_variation") ?? false;
  const canTech = actor?.can("review_technical") ?? false;
  const canComm = actor?.can("review_commercial") ?? false;
  const canAuth = actor?.can("authorize_variation") ?? false;

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Raise a variation</CardTitle>
        </CardHeader>
        <CardContent>
          {canSubmit ? (
            <RaiseVariationForm projectId={projectId} />
          ) : (
            <p className="text-sm text-muted-foreground">
              You do not have authority to raise variations on this project.
            </p>
          )}
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No variations have been raised on this project.
        </p>
      ) : null}

      {rows.map(({ variation, originatorName, reviews }) => {
        const hasCommercialApproval = reviews.some(
          (review) => review.review.type === "commercial" && review.review.decision === "approved",
        );
        const showTech = canTech && variation.status !== "executed" && variation.status !== "withdrawn";
        const showComm = canComm && variation.status !== "executed" && variation.status !== "withdrawn";
        const showAuth =
          canAuth &&
          variation.status !== "executed" &&
          variation.status !== "withdrawn" &&
          hasCommercialApproval;

        return (
          <Card key={variation.id}>
            <CardContent className="flex flex-col gap-5 p-5">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="tabular text-xs text-muted-foreground">
                    {variation.reference}
                  </span>
                  <StatusBadge status={variation.status} />
                  {variation.instructionRef ? (
                    <Badge tone="outline">Instruction {variation.instructionRef}</Badge>
                  ) : null}
                </div>
                <h2 className="text-base font-semibold">{variation.title}</h2>
                <p className="max-w-3xl text-sm text-muted-foreground">
                  {variation.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  Raised by {originatorName ?? "—"}
                  {variation.timeImpactDays > 0 ? ` · ${variation.timeImpactDays} days time impact` : ""}
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
                      <Money minor={variation.assessedMinor} currency={currency} />
                    ) : (
                      <span className="text-muted-foreground">Not yet</span>
                    )}
                  </p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <span className="text-xs text-muted-foreground">Committed</span>
                  <p className="mt-1 font-medium">
                    {variation.committedMinor !== null ? (
                      <Money minor={variation.committedMinor} currency={currency} />
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
                  <p className="text-sm text-muted-foreground">No reviews recorded yet.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {reviews.map(({ review, reviewerName }) => (
                      <li key={review.id} className="flex gap-3">
                        <span className="mt-0.5">{decisionIcon(review.decision)}</span>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm">
                            <span className="font-medium capitalize">{review.type}</span> review ·{" "}
                            <span className="capitalize">{review.decision.replace(/_/g, " ")}</span> by{" "}
                            {reviewerName ?? "—"}
                          </span>
                          {review.notes ? (
                            <span className="text-sm text-muted-foreground">{review.notes}</span>
                          ) : null}
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(review.createdAt)}
                            {review.assessedMinor !== null ? (
                              <>
                                {" "}
                                · assessed{" "}
                                <Money minor={review.assessedMinor} currency={currency} />
                              </>
                            ) : null}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {(showTech || showComm || showAuth) ? (
                <div className="flex flex-col gap-3 border-t border-border pt-4">
                  <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Actions
                  </h3>
                  {showTech ? (
                    <ReviewVariationForm
                      projectId={projectId}
                      variationId={variation.id}
                      type="technical"
                    />
                  ) : null}
                  {showComm ? (
                    <ReviewVariationForm
                      projectId={projectId}
                      variationId={variation.id}
                      type="commercial"
                    />
                  ) : null}
                  {showAuth ? (
                    <AuthorizeVariationForm projectId={projectId} variationId={variation.id} />
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

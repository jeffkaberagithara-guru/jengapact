import { Money } from "@/components/app/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDateTime } from "@/lib/date";
import { loadProjectActor } from "@/modules/access/context";
import {
  getPaymentLedger,
  getProjectById,
  getProjectOverview,
} from "@/modules/projects/queries";
import { CertificateForm } from "./certificate-form";
import { ClaimForm } from "./claim-form";
import { PaymentForm } from "./payment-form";
import { ValuationForm } from "./valuation-form";

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [actor, project, overview, ledger] = await Promise.all([
    loadProjectActor(projectId),
    getProjectById(projectId),
    getProjectOverview(projectId),
    getPaymentLedger(projectId),
  ]);
  const currency = project?.currency ?? "KES";
  const canClaim = actor?.can("submit_claim") ?? false;
  const canValue = actor?.can("assess_valuation") ?? false;
  const canCert = actor?.can("issue_certificate") ?? false;
  const canPay = actor?.can("record_payment") ?? false;
  const certOptions = ledger.certificates.map((c) => ({
    id: c.certificate.id,
    reference: c.certificate.reference,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Certified"
          value={<Money minor={overview.certifiedMinor} currency={currency} />}
        />
        <Stat label="Paid" value={<Money minor={overview.paidMinor} currency={currency} />} />
        <Stat
          label="Outstanding"
          value={<Money minor={overview.outstandingMinor} currency={currency} />}
        />
        <Stat
          label="Retention held"
          value={<Money minor={overview.retentionHeldMinor} currency={currency} />}
        />
      </div>

      {(canClaim || canCert || canPay) ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {canClaim ? (
            <Card>
              <CardHeader>
                <CardTitle>Submit payment claim</CardTitle>
              </CardHeader>
              <CardContent>
                <ClaimForm projectId={projectId} />
              </CardContent>
            </Card>
          ) : null}
          {canCert ? (
            <Card>
              <CardHeader>
                <CardTitle>Issue payment certificate</CardTitle>
              </CardHeader>
              <CardContent>
                <CertificateForm projectId={projectId} claimId={null} />
              </CardContent>
            </Card>
          ) : null}
          {canPay ? (
            <Card>
              <CardHeader>
                <CardTitle>Record payment</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentForm projectId={projectId} certificates={certOptions} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Payment claims</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="border-0">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Reference</TableHeaderCell>
                <TableHeaderCell>Claimant</TableHeaderCell>
                <TableHeaderCell>Period end</TableHeaderCell>
                <TableHeaderCell>Submitted</TableHeaderCell>
                <TableHeaderCell className="text-right">Claimed</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledger.claims.map(({ claim, claimantName }) => {
                const showValuation = canValue && claim.status !== "certified" && claim.status !== "withdrawn";
                return (
                  <TableRow key={claim.id}>
                    <TableCell className="tabular">{claim.reference}</TableCell>
                    <TableCell>{claimantName ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {claim.periodEnd ? formatDate(claim.periodEnd) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {claim.submittedAt ? formatDateTime(claim.submittedAt) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Money minor={claim.claimedMinor} currency={currency} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={claim.status} />
                      {showValuation ? (
                        <div className="mt-3">
                          <ValuationForm projectId={projectId} claimId={claim.id} />
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Valuations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="border-0">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Valuer</TableHeaderCell>
                <TableHeaderCell>Notes</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell className="text-right">Assessed</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledger.valuations.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={4}>
                    No valuations recorded.
                  </TableCell>
                </TableRow>
              ) : (
                ledger.valuations.map(({ valuation, valuerName }) => (
                  <TableRow key={valuation.id}>
                    <TableCell>{valuerName ?? "—"}</TableCell>
                    <TableCell className="max-w-md text-muted-foreground">
                      {valuation.notes ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(valuation.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Money minor={valuation.assessedMinor} currency={currency} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment certificates</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="border-0">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Reference</TableHeaderCell>
                <TableHeaderCell>Issued</TableHeaderCell>
                <TableHeaderCell>Due</TableHeaderCell>
                <TableHeaderCell className="text-right">Certified</TableHeaderCell>
                <TableHeaderCell className="text-right">Retention</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledger.certificates.map(({ certificate }) => (
                <TableRow key={certificate.id}>
                  <TableCell className="tabular">{certificate.reference}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {certificate.issuedAt ? formatDateTime(certificate.issuedAt) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {certificate.dueDate ? formatDate(certificate.dueDate) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Money minor={certificate.certifiedMinor} currency={currency} />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    <Money minor={certificate.retentionMinor} currency={currency} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={certificate.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments recorded</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="border-0">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Paid</TableHeaderCell>
                <TableHeaderCell>Method</TableHeaderCell>
                <TableHeaderCell>Bank reference</TableHeaderCell>
                <TableHeaderCell>Recorded by</TableHeaderCell>
                <TableHeaderCell className="text-right">Amount</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledger.payments.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={5}>
                    No payments recorded.
                  </TableCell>
                </TableRow>
              ) : (
                ledger.payments.map(({ payment, recorderName }) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(payment.paidAt)}
                    </TableCell>
                    <TableCell className="uppercase">{payment.method}</TableCell>
                    <TableCell className="tabular text-muted-foreground">
                      {payment.externalReference ?? "—"}
                    </TableCell>
                    <TableCell>{recorderName ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Money minor={payment.amountMinor} currency={currency} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {ledger.retention.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Retention</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="border-0">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Created</TableHeaderCell>
                  <TableHeaderCell>Released</TableHeaderCell>
                  <TableHeaderCell className="text-right">Amount</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ledger.retention.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(entry.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.releasedAt ? formatDateTime(entry.releasedAt) : "Held"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Money minor={entry.amountMinor} currency={currency} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

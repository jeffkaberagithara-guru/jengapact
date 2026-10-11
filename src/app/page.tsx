import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  FileCheck2,
  Gavel,
  History,
  Landmark,
  Lock,
  Receipt,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";

const STAGES = [
  {
    label: "Negotiate",
    detail: "Clauses drafted, proposed and agreed with a visible history.",
  },
  {
    label: "Agree",
    detail: "A version is frozen with a content hash before signature.",
  },
  {
    label: "Sign",
    detail: "Execution recorded against the exact agreed version.",
  },
  {
    label: "Build",
    detail:
      "Instructions, variations and site records captured as they happen.",
  },
  {
    label: "Verify",
    detail: "Work measured and valued on the contract's own rates.",
  },
  {
    label: "Approve",
    detail: "Technical review and commercial authorization kept separate.",
  },
  {
    label: "Pay",
    detail: "Claims certified, then payments recorded against the certificate.",
  },
  {
    label: "Closeout",
    detail: "Retention released against a defensible, complete record.",
  },
];

const CAPABILITIES = [
  {
    icon: Scale,
    title: "Variations without the fog",
    body: "A variation is not an invoice. It carries its own reference, reason, time impact and separate technical and commercial reviews before anyone commits money.",
  },
  {
    icon: Receipt,
    title: "Claims, certificates, payments",
    body: "Four distinct records, never one status column. A submitted claim is not a certified amount, and a certificate is not a payment.",
  },
  {
    icon: FileCheck2,
    title: "Evidence you can point to",
    body: "Documents are fingerprinted and linked to the decision they support, so the record answers why, not just what.",
  },
  {
    icon: Users,
    title: "An authority matrix",
    body: "Who may authorize, review or record is set per project from the actual appointment, not assumed from a job title.",
  },
  {
    icon: History,
    title: "An append-only ledger",
    body: "Consequential events are written once. Corrections are new events, never quiet edits, so the timeline stays honest.",
  },
  {
    icon: Gavel,
    title: "Disputes with a paper trail",
    body: "When a payment falls short, the certified amount, due date and gap are already on the record.",
  },
];

const TRUST = [
  {
    icon: Landmark,
    title: "Money is integer minor units",
    body: "Every amount is stored in cents. No floating point anywhere near a financial figure, so totals reconcile exactly.",
  },
  {
    icon: ShieldCheck,
    title: "Separation of duties",
    body: "The engineer recommends. The quantity surveyor values. The client authorizes. Those are different hands by design.",
  },
  {
    icon: Lock,
    title: "Project-scoped access",
    body: "Authority is derived from your role on this project. A client on one site can be a consultant on another.",
  },
  {
    icon: Building2,
    title: "Kenya-first",
    body: "JBC 1999 and FIDIC forms, Kenya time, KES, and payment methods that match how money actually moves here.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
         <section className="relative grid-rule border-b border-border overflow-hidden bg-forest-50">
           <video
             autoPlay
             muted
             loop
             playsInline
             aria-hidden="true"
             poster="/images/construction-site-1.jpg"
             className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30"
           >
             <source src="/videos/construction-hero.mp4" type="video/mp4" />
           </video>
           <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest-50 via-forest-50/90 to-forest-50/40" />
           <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:py-28 relative z-10">
             <span className="inline-flex items-center gap-2 rounded-sm border border-forest-100 bg-surface/95 backdrop-blur-sm px-3 py-1 text-xs font-medium text-forest-700">
               <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
               Kenya-first construction transparency
             </span>
             <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
               Build without the uncertainty.
             </h1>
             <p className="max-w-2xl text-lg text-muted-foreground">
               JengaPact turns the agreement, the variations, the valuations, the
               certificates and the payments into one attributable record — so a
               project does not depend on who remembers what was said.
             </p>
             <div className="flex flex-wrap items-center gap-3">
               <Link
                 href="/sign-up"
                 className={cn(
                   buttonVariants({ variant: "primary", size: "lg" }),
                 )}
               >
                 Start a project
                 <ArrowRight className="h-4 w-4" aria-hidden="true" />
               </Link>
               <Link
                 href="/sign-in"
                 className={cn(
                   buttonVariants({ variant: "outline", size: "lg" }),
                 )}
               >
                 Sign in
               </Link>
             </div>
             <dl className="mt-6 grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
               {[
                 ["8", "project stages"],
                 ["4", "money records"],
                 ["1", "append-only ledger"],
                 ["0", "floating-point totals"],
               ].map(([value, label]) => (
                 <div key={label} className="flex flex-col">
                   <dt className="tabular text-2xl font-semibold text-primary">
                     {value}
                   </dt>
                   <dd className="text-xs text-muted-foreground">{label}</dd>
                 </div>
               ))}
             </dl>
           </div>
         </section>

        <section id="how" className="border-b border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              One spine from negotiation to final payment
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Each stage leaves a record the next one depends on. Nothing
              consequential is a private note.
            </p>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STAGES.map((stage, index) => (
                <li
                  key={stage.label}
                  className="rounded-lg border border-border bg-surface p-5 shadow-card"
                >
                  <span className="tabular text-sm font-semibold text-forest-600">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 text-base font-semibold">
                    {stage.label}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {stage.detail}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

         <section
           id="capabilities"
           className="border-b border-border bg-sand-100 relative overflow-hidden"
         >
           <div className="absolute inset-0 -z-10 opacity-10">
             <img
               src="/images/construction-site-2.jpg"
               alt="Construction site building progress"
               className="h-full w-full object-cover"
             />
           </div>
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              What the platform actually enforces
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CAPABILITIES.map((item) => (
                <Card key={item.title}>
                  <CardHeader>
                    <item.icon
                      className="h-5 w-5 text-accent"
                      aria-hidden="true"
                    />
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

         <section id="trust" className="border-b border-border relative overflow-hidden">
           <div className="absolute inset-0 -z-10 opacity-5">
             <img
               src="/images/construction-team.jpg"
               alt="Construction team reviewing documents"
               className="h-full w-full object-cover"
             />
           </div>
           <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:py-20 lg:grid-cols-2 relative">
             <div className="flex flex-col gap-4">
               <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                 A record is evidence of process
               </h2>
               <p className="text-muted-foreground">
                 JengaPact does not claim to prove that work is true or that a
                 document is legally valid. It makes the process that led to a
                 decision visible, attributable and hard to quietly rewrite.
               </p>
               <div className="mt-2 flex items-center gap-2 rounded-md border border-border bg-surface/95 backdrop-blur-sm p-4 text-sm text-muted-foreground">
                 <ClipboardList
                   className="h-5 w-5 text-forest-600"
                   aria-hidden="true"
                 />
                 Every consequential change writes one event, in the same
                 transaction as the change itself.
               </div>
             </div>
             <div className="grid gap-5 sm:grid-cols-2">
               {TRUST.map((item) => (
                 <div
                   key={item.title}
                   className="rounded-lg border border-border bg-surface/95 backdrop-blur-sm p-5 shadow-card"
                 >
                   <item.icon
                     className="h-5 w-5 text-accent"
                     aria-hidden="true"
                   />
                   <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
                   <p className="mt-1 text-sm text-muted-foreground">
                     {item.body}
                   </p>
                 </div>
               ))}
             </div>
           </div>
         </section>

        <section className="bg-primary">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-primary-foreground sm:text-3xl">
                Open the Sakura Court demo
              </h2>
              <p className="mt-2 max-w-xl text-forest-100">
                A live build-stage project: an executed variation, one under
                review, a certified interim payment that was underpaid, and the
                ledger that ties it together.
              </p>
            </div>
            <Link
              href="/sign-up"
              className={cn(
                buttonVariants({ variant: "accent", size: "lg" }),
                "shrink-0",
              )}
            >
              Create an account
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

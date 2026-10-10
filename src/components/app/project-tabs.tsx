"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { segment: "", label: "Overview" },
  { segment: "milestones", label: "Milestones" },
  { segment: "variations", label: "Variations" },
  { segment: "payments", label: "Payments" },
  { segment: "issues", label: "Issues" },
  { segment: "ledger", label: "Ledger" },
  { segment: "agreement", label: "Agreement" },
  { segment: "team", label: "Team" },
];

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border">
      {TABS.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base;
        const active = pathname === href;
        return (
          <Link
            key={tab.segment || "overview"}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

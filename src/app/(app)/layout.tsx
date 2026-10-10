import Link from "next/link";
import type { ReactNode } from "react";
import { SidebarNav } from "@/components/app/sidebar-nav";
import { UserMenu } from "@/components/app/user-menu";
import { Logo } from "@/components/ui/logo";
import { getDomainUser } from "@/modules/auth/user";
import { requireUser } from "@/modules/auth/server";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const profile = await getDomainUser(user.id);
  const displayName = profile?.fullName ?? user.name ?? user.email;

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface px-3 py-4 lg:flex">
        <Link
          href="/dashboard"
          className="px-3 py-2"
          aria-label="JengaPact home"
        >
          <Logo />
        </Link>
        <div className="mt-4">
          <SidebarNav />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:px-8">
          <Link
            href="/dashboard"
            className="lg:hidden"
            aria-label="JengaPact home"
          >
            <Logo />
          </Link>
          <div className="hidden lg:block" />
          <UserMenu name={displayName} email={user.email} />
        </header>
        <div className="border-b border-border bg-surface px-4 py-2 lg:hidden">
          <SidebarNav />
        </div>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

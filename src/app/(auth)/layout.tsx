import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-sand-100">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-4">
        <Link href="/" aria-label="JengaPact home">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="mx-auto w-full max-w-6xl px-4 py-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} JengaPact
      </footer>
    </div>
  );
}

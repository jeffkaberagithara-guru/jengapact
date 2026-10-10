import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-forest-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">
            Built for Kenyan construction. Every claim, certificate and payment
            is recorded and attributable.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/sign-in" className="hover:text-foreground">
            Sign in
          </Link>
          <Link href="/sign-up" className="hover:text-foreground">
            Create account
          </Link>
          <a
            href="mailto:hello@jengapact.example"
            className="hover:text-foreground"
          >
            Contact
          </a>
        </nav>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} JengaPact. Records are evidence of
          process, not proof of truth or legal validity.
        </div>
      </div>
    </footer>
  );
}

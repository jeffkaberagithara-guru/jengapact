import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const redirectTo =
    params.next && params.next.startsWith("/") ? params.next : "/dashboard";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in to JengaPact</CardTitle>
        <CardDescription>
          Access your projects, variations, certificates and the ledger.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <SignInForm redirectTo={redirectTo} />
        <p className="text-sm text-muted-foreground">
          New here?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-accent hover:underline"
          >
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

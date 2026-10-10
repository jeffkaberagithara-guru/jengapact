import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default function SignUpPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your JengaPact account</CardTitle>
        <CardDescription>
          Start a project, or open the Sakura Court demo once you are in.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <SignUpForm redirectTo="/dashboard" />
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-accent hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

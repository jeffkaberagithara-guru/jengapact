"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/modules/auth/auth-client";

interface UserMenuProps {
  name: string;
  email: string;
}

export function UserMenu({ name, email }: UserMenuProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSignOut() {
    setPending(true);
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden flex-col text-right sm:flex">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-xs text-muted-foreground">{email}</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onSignOut}
        disabled={pending}
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Sign out</span>
      </Button>
    </div>
  );
}

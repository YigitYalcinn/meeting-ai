"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.refresh();
      router.push("/login");
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="btn-secondary h-10 min-h-10 px-3"
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}

import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/workspace");
  }

  return (
    <main className="container-page grid min-h-[calc(100vh-66px)] items-center py-10">
      <div className="mx-auto w-full max-w-md">
        <AuthForm mode="login" />
      </div>
    </main>
  );
}

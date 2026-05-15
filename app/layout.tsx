import type { Metadata } from "next";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeetAI | Meeting Intelligence Workspace",
  description:
    "AI meeting summaries, transcripts, action items, and executive-ready exports in one workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userPromise = getCurrentUser();

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="app-shell min-h-full">
        <Header userPromise={userPromise} />
        {children}
      </body>
    </html>
  );
}

async function Header({
  userPromise,
}: {
  userPromise: ReturnType<typeof getCurrentUser>;
}) {
  const user = await userPromise;

  return (
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/86 backdrop-blur-xl">
          <div className="container-page flex items-center justify-between gap-4 py-3">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#101828] text-sm font-black text-white shadow-[0_10px_24px_rgba(16,24,40,0.16)]">
                MA
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-950">
                  MeetAI
                </span>
                <span className="block truncate text-xs font-medium text-slate-500">
                  Meeting intelligence workspace
                </span>
              </span>
            </Link>

            <nav className="hidden items-center rounded-xl border border-slate-200 bg-slate-50 p-1 md:flex">
              <Link
                href="/"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-950"
              >
                Overview
              </Link>
              <Link
                href="/workspace"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-950"
              >
                Workspace
              </Link>
              <Link
                href="/#capabilities"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-950"
              >
                Capabilities
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              {user ? (
                <>
                  <span className="hidden max-w-[13rem] truncate text-sm font-bold text-slate-600 md:inline">
                    {user.email}
                  </span>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-secondary h-10 min-h-10 px-3">
                    Sign in
                  </Link>
                  <Link href="/register" className="btn-dark h-10 min-h-10 px-3">
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Meeting Summary & Action Tracker",
  description: "Portfolio MVP for meeting summaries, key points, and action tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-40 border-b border-slate-800/70 bg-[#0b1422]/92 text-white backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1e3a5f_0%,#2563eb_100%)] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)]">
                  AM
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    AI Meeting Summary & Action Tracker
                  </p>
                  <p className="text-xs text-slate-300">
                    Meeting operations workspace
                  </p>
                </div>
              </Link>

              <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1.5 lg:flex">
                <Link
                  href="/"
                  className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 shadow-sm"
                >
                  Home
                </Link>
                <Link
                  href="/workspace"
                  className="rounded-full px-4 py-2 text-sm text-slate-300 transition hover:text-white"
                >
                  Workspace
                </Link>
                <Link
                  href="/#about"
                  className="rounded-full px-4 py-2 text-sm text-slate-300 transition hover:text-white"
                >
                  About
                </Link>
                <Link
                  href="/#contact"
                  className="rounded-full px-4 py-2 text-sm text-slate-300 transition hover:text-white"
                >
                  Contact
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-white/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 sm:inline-flex">
                MVP
              </span>
              <span className="rounded-full bg-blue-500/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100 ring-1 ring-blue-400/25">
                System ready
              </span>
            </div>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/96 shadow-[0_24px_70px_rgba(15,23,42,0.05)]">
          <div className="grid gap-8 px-6 py-10 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10">
            <div className="space-y-6">
              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-blue-900 ring-1 ring-blue-100">
                Corporate Overview
              </span>

              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-[3.8rem]">
                  Enterprise-style meeting intelligence for modern teams.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  AI Meeting Summary & Action Tracker helps teams capture
                  meetings, structure outcomes, and convert discussions into
                  clear decisions, tasks, and reports inside one professional
                  workspace.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/workspace"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[#0f1b2d] px-6 text-sm font-semibold text-white transition hover:bg-[#162843]"
                >
                  Open Workspace
                </Link>
                <a
                  href="#about"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                >
                  About Us
                </a>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  What the platform does
                </p>
                <div className="mt-5 space-y-4">
                  <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-950">
                      Capture every meeting source
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Manual notes, text files, and audio uploads all enter the
                      same structured system.
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-950">
                      Generate structured AI outputs
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Summaries, key points, and action items stay app-friendly
                      and ready for export.
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-950">
                      Export clean reports
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Premium PDF reports make the output useful beyond the app.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[1.7rem] border border-slate-200 bg-white/96 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Product
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              One workflow from capture to report
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The platform centralizes note capture, transcript generation,
              AI analysis, and export so teams can work from one source of
              truth.
            </p>
          </div>

          <div className="rounded-[1.7rem] border border-slate-200 bg-white/96 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Value
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              Faster alignment after every meeting
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Teams leave meetings with clear summaries, visible risks, and
              actionable follow-up instead of scattered notes.
            </p>
          </div>

          <div className="rounded-[1.7rem] border border-slate-200 bg-white/96 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Delivery
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              Built like a real internal operations tool
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The interface separates corporate messaging from the operational
              workspace, which makes the product feel more complete and mature.
            </p>
          </div>
        </section>

        <section
          id="about"
          className="rounded-[2rem] border border-slate-200 bg-white/96 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] sm:p-8"
        >
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                About Us
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Built for companies that want cleaner meeting operations.
              </h2>
            </div>

            <div className="space-y-4 text-sm leading-7 text-slate-600">
              <p>
                AI Meeting Summary & Action Tracker is designed as a practical
                operations product. It focuses on turning raw meeting content
                into structured, reusable outputs that teams can read, share,
                and act on quickly.
              </p>
              <p>
                The system prioritizes clean workflows, usable dashboards, and
                export-ready results so the product feels closer to a serious
                SaaS application than a simple AI demo.
              </p>
            </div>
          </div>
        </section>

        <section
          id="contact"
          className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#0d1726_0%,#14253d_100%)] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8"
        >
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                Contact
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Want to see the workspace in action?
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
                This MVP showcases how AI can sit inside a real full-stack
                product workflow with dashboards, analysis views, and exportable
                deliverables.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Email
                </p>
                <p className="mt-3 text-sm font-medium text-white">
                  contact@meetingtracker.app
                </p>
              </div>
              <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Workspace
                </p>
                <p className="mt-3 text-sm font-medium text-white">
                  Operational dashboard available inside the app
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";

const capabilities = [
  {
    title: "Multi-source capture",
    body: "Manual notes, markdown files, text files, and audio recordings enter one consistent meeting record.",
  },
  {
    title: "AI-ready workflow",
    body: "Transcripts, summaries, decisions, key points, and action items stay connected to the original source.",
  },
  {
    title: "Executive reporting",
    body: "Structured outputs and PDF export make the workspace useful for operators, founders, and team leads.",
  },
];

export default function Home() {
  return (
    <main className="pb-12 text-slate-950">
      <section className="border-b border-slate-200/80 bg-white/56">
        <div className="container-page grid min-h-[calc(100vh-66px)] items-center gap-10 py-12 lg:grid-cols-[1.03fr_0.97fr]">
          <div className="max-w-3xl">
            <p className="eyebrow">Meeting operations platform</p>
            <h1 className="mt-5 text-5xl font-black leading-[0.96] tracking-normal text-slate-950 sm:text-6xl lg:text-7xl">
              MeetAI
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Turn meetings into clean transcripts, summaries, decisions, and
              accountable follow-up without losing the operational context that
              teams need after the call ends.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/workspace" className="btn-primary">
                Launch workspace
                <span aria-hidden="true">-&gt;</span>
              </Link>
              <a href="#capabilities" className="btn-secondary">
                View capabilities
              </a>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white">
              <div className="p-4">
                <p className="text-2xl font-black">3</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Input channels
                </p>
              </div>
              <div className="p-4">
                <p className="text-2xl font-black">4</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Output types
                </p>
              </div>
              <div className="p-4">
                <p className="text-2xl font-black">PDF</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Report export
                </p>
              </div>
            </div>
          </div>

          <div className="surface overflow-hidden rounded-2xl">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow">Live workspace preview</p>
                  <h2 className="mt-2 text-xl font-black">
                    Meeting command center
                  </h2>
                </div>
                <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                  Active
                </span>
              </div>
            </div>

            <div className="grid gap-4 p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {["Captured", "Analyzed", "Pending"].map((label, index) => (
                  <div key={label} className="surface-muted rounded-xl p-4">
                    <p className="text-xs font-bold text-slate-500">{label}</p>
                    <p className="mt-3 text-3xl font-black text-slate-950">
                      {[18, 12, 3][index]}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white">
                {[
                  ["Product roadmap review", "Summary ready", "Manual"],
                  ["Customer onboarding sync", "Transcript needed", "Audio"],
                  ["Q2 operating plan", "Analysis ready", "Text file"],
                ].map((row) => (
                  <div
                    key={row[0]}
                    className="grid gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                  >
                    <p className="font-bold text-slate-950">{row[0]}</p>
                    <span className="text-sm font-semibold text-slate-500">
                      {row[1]}
                    </span>
                    <span className="w-fit rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      {row[2]}
                    </span>
                  </div>
                ))}
              </div>

              <div className="executive-brief-card rounded-xl p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em]">
                  Executive brief
                </p>
                <p className="mt-3 text-sm leading-6">
                  Decisions, risks, owners, and due dates are separated into a
                  readable report layer for faster review.
                </p>
                <div className="mt-5 grid gap-2">
                  <div className="h-2 rounded-full bg-blue-400" />
                  <div className="h-2 w-10/12 rounded-full bg-teal-300" />
                  <div className="h-2 w-7/12 rounded-full bg-amber-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="container-page py-12">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Capabilities</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-normal text-slate-950">
              A focused product surface for real meeting work.
            </h2>
          </div>
          <Link href="/workspace" className="btn-secondary w-fit">
            Go to workspace
          </Link>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {capabilities.map((item) => (
            <article key={item.title} className="content-card p-6">
              <h3 className="text-lg font-black text-slate-950">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

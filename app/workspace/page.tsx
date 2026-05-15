import Link from "next/link";
import { redirect } from "next/navigation";

import { CreateMeetingForm } from "@/components/meetings/create-meeting-form";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const sourceTypeLabels: Record<string, string> = {
  manual: "Manual",
  text_file: "Text file",
  audio_file: "Audio",
};

const statusLabels: Record<string, string> = {
  ready: "Ready",
  pending_transcription: "Pending transcript",
  transcribing: "Transcribing",
  transcription_failed: "Transcript failed",
};

function getMeetingPreview(meeting: {
  sourceType: string;
  status: string;
  summary: string | null;
  transcript: string | null;
  transcriptionError: string | null;
  rawText: string | null;
}) {
  if (meeting.summary?.trim()) {
    return meeting.summary;
  }

  if (meeting.sourceType === "audio_file") {
    return (
      meeting.transcript?.trim() ||
      (meeting.status === "transcription_failed"
        ? meeting.transcriptionError || "Transcription failed."
        : "Audio uploaded. Generate the transcript to continue.")
    );
  }

  return meeting.rawText?.trim() || "No meeting notes added yet.";
}

function getStatusTone(status: string) {
  if (status === "ready") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }

  if (status === "transcription_failed") {
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  }

  if (status === "transcribing") {
    return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
  }

  return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
}

export default async function WorkspacePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const meetings = await prisma.meeting.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const analyzedMeetings = meetings.filter((meeting) => meeting.summary?.trim());
  const pendingTranscriptionMeetings = meetings.filter(
    (meeting) => meeting.status === "pending_transcription",
  );
  const readyForAnalysisMeetings = meetings.filter((meeting) => {
    if (meeting.sourceType === "audio_file") {
      return Boolean(meeting.transcript?.trim()) && !meeting.summary?.trim();
    }

    return Boolean(meeting.rawText?.trim()) && !meeting.summary?.trim();
  });

  return (
    <main className="pb-12 text-slate-950">
      <section className="border-b border-slate-200/80 bg-white/64">
        <div className="container-page py-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="eyebrow">Workspace</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-normal text-slate-950 sm:text-5xl">
                Meeting operations, organized for daily use.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Capture new meetings, monitor transcript status, run AI
                analysis, and open clean records from a single product surface.
              </p>
            </div>
            <nav className="flex flex-wrap gap-2">
              <a href="#create" className="btn-primary">
                New meeting
              </a>
              <a href="#records" className="btn-secondary">
                View records
              </a>
            </nav>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="content-card p-5">
              <p className="text-sm font-bold text-slate-500">Captured</p>
              <p className="mt-3 text-4xl font-black">{meetings.length}</p>
              <p className="mt-2 text-sm text-slate-500">Total meetings</p>
            </div>
            <div className="content-card p-5">
              <p className="text-sm font-bold text-slate-500">Analyzed</p>
              <p className="mt-3 text-4xl font-black">
                {analyzedMeetings.length}
              </p>
              <p className="mt-2 text-sm text-slate-500">AI summaries ready</p>
            </div>
            <div className="content-card p-5">
              <p className="text-sm font-bold text-slate-500">Ready</p>
              <p className="mt-3 text-4xl font-black">
                {readyForAnalysisMeetings.length}
              </p>
              <p className="mt-2 text-sm text-slate-500">Awaiting analysis</p>
            </div>
            <div className="content-card p-5">
              <p className="text-sm font-bold text-slate-500">Pending</p>
              <p className="mt-3 text-4xl font-black">
                {pendingTranscriptionMeetings.length}
              </p>
              <p className="mt-2 text-sm text-slate-500">Need transcript</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-6 py-8 xl:grid-cols-[0.92fr_1.08fr]">
        <aside id="create" className="xl:sticky xl:top-24 xl:self-start">
          <CreateMeetingForm />
        </aside>

        <section id="records" className="surface rounded-2xl">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Records</p>
                <h2 className="mt-2 text-2xl font-black">Meeting library</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Open any record to review source content, generate analysis,
                  or export the final PDF report.
                </p>
              </div>
              <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600">
                {meetings.length} records
              </span>
            </div>
          </div>

          {meetings.length === 0 ? (
            <div className="m-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <h3 className="text-xl font-black text-slate-950">
                No meetings yet
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
                Create the first record from the form. It will appear in this
                library immediately.
              </p>
            </div>
          ) : (
            <div>
              <div className="hidden grid-cols-[1.5fr_0.55fr_0.65fr_0.75fr] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500 lg:grid">
                <span>Meeting</span>
                <span>Source</span>
                <span>Status</span>
                <span>Created</span>
              </div>

              <div className="divide-y divide-slate-200">
                {meetings.map((meeting) => (
                  <Link
                    key={meeting.id}
                    href={`/meetings/${meeting.id}`}
                    className="block px-5 py-5 transition hover:bg-slate-50 sm:px-6"
                  >
                    <div className="grid gap-4 lg:grid-cols-[1.5fr_0.55fr_0.65fr_0.75fr] lg:items-start">
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-black text-slate-950">
                              {meeting.title}
                            </h3>
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                              {getMeetingPreview(meeting)}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-slate-400 lg:hidden">
                            -&gt;
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 lg:block">
                        <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400 lg:hidden">
                          Source
                        </span>
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                          {sourceTypeLabels[meeting.sourceType] ??
                            meeting.sourceType}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 lg:block">
                        <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400 lg:hidden">
                          Status
                        </span>
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-black ${getStatusTone(meeting.status)}`}
                        >
                          {statusLabels[meeting.status] ?? meeting.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-500 lg:block">
                        <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400 lg:hidden">
                          Created
                        </span>
                        {meeting.createdAt.toLocaleString()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

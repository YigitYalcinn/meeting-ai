import Link from "next/link";

import { CreateMeetingForm } from "@/components/meetings/create-meeting-form";
import { prisma } from "@/lib/prisma";

const sourceTypeLabels: Record<string, string> = {
  manual: "Manual",
  text_file: "Text file",
  audio_file: "Audio",
};

const statusLabels: Record<string, string> = {
  ready: "Ready",
  pending_transcription: "Pending transcription",
  transcribing: "Transcribing",
  transcription_failed: "Transcription failed",
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
    return "bg-blue-50 text-blue-800 ring-1 ring-blue-200";
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
  const meetings = await prisma.meeting.findMany({
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
    <main className="min-h-screen px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-[1.5rem] border border-slate-200/80 bg-white/92 px-4 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.04)] backdrop-blur sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Workspace Navigation
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Move between overview, creation, and records like a real product dashboard.
              </p>
            </div>

            <nav className="flex flex-wrap items-center gap-2">
              <a
                href="#overview"
                className="rounded-full bg-[#0f1b2d] px-4 py-2 text-sm font-medium text-white"
              >
                Overview
              </a>
              <a
                href="#create"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
              >
                Create Meeting
              </a>
              <a
                href="#records"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
              >
                Records
              </a>
            </nav>
          </div>
        </section>

        <section
          id="overview"
          className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"
        >
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/96 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="space-y-8">
              <div className="space-y-4">
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-blue-800 ring-1 ring-blue-100">
                  Workspace Overview
                </span>
                <div className="space-y-4">
                  <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-[3.45rem]">
                    Meeting intelligence, structured like a real operations platform.
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                    Capture meetings from multiple sources, convert audio into text,
                    generate structured AI outputs, and export professional reports
                    from one serious workspace.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Meetings captured</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {meetings.length}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Total records inside the workspace
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Summaries ready</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {analyzedMeetings.length}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Meetings already analyzed by AI
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Awaiting transcript</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {pendingTranscriptionMeetings.length}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Audio records still waiting for text
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[1.6rem] border border-slate-800 bg-[linear-gradient(180deg,#0d1726_0%,#14253d_100%)] p-6 text-white">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                        Workflow
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold">
                        Product flow
                      </h2>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                      End to end
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4">
                    <div className="grid gap-2 rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm font-semibold">1. Capture</p>
                      <p className="text-sm leading-6 text-slate-300">
                        Manual notes, text files, and audio uploads all enter the same system.
                      </p>
                    </div>
                    <div className="grid gap-2 rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm font-semibold">2. Prepare text</p>
                      <p className="text-sm leading-6 text-slate-300">
                        Audio meetings move through transcription before analysis.
                      </p>
                    </div>
                    <div className="grid gap-2 rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm font-semibold">3. Analyze and export</p>
                      <p className="text-sm leading-6 text-slate-300">
                        Structured AI outputs and PDF reports stay tied to the original meeting.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-slate-200 bg-white p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Operations Snapshot
                  </p>

                  <div className="mt-6 space-y-5">
                    <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Ready for analysis</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-950">
                        {readyForAnalysisMeetings.length}
                      </p>
                    </div>

                    <div className="space-y-3 text-sm text-slate-600">
                      <div className="flex items-center justify-between gap-4">
                        <span>Capture channels</span>
                        <span className="font-medium text-slate-950">
                          Manual, text, audio
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Analysis format</span>
                        <span className="font-medium text-slate-950">
                          Structured JSON
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Export format</span>
                        <span className="font-medium text-slate-950">PDF</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div id="create">
            <CreateMeetingForm />
          </div>
        </section>

        <section
          id="records"
          className="rounded-[2rem] border border-slate-200/80 bg-white/96 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] sm:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Meeting Records
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Workspace table
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use this as the operational list view for every meeting saved in the system.
              </p>
            </div>

            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
              {meetings.length} total records
            </div>
          </div>

          {meetings.length === 0 ? (
            <div className="mt-6 rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <h3 className="text-xl font-semibold text-slate-950">
                No meetings yet
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
                Create your first meeting from the workspace panel above. It will appear here immediately.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-[1.6rem] border border-slate-200">
              <div className="hidden grid-cols-[1.7fr_0.7fr_0.7fr_0.9fr] gap-4 bg-slate-100/80 px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 lg:grid">
                <span>Meeting</span>
                <span>Source</span>
                <span>Status</span>
                <span>Created</span>
              </div>

              <div className="divide-y divide-slate-200 bg-white">
                {meetings.map((meeting) => (
                  <Link
                    key={meeting.id}
                    href={`/meetings/${meeting.id}`}
                    className="block px-5 py-5 transition hover:bg-slate-50 sm:px-6"
                  >
                    <div className="grid gap-4 lg:grid-cols-[1.7fr_0.7fr_0.7fr_0.9fr] lg:items-start">
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-4 lg:block">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-950">
                              {meeting.title}
                            </h3>
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                              {getMeetingPreview(meeting)}
                            </p>
                          </div>
                          <span className="text-sm text-slate-400 lg:hidden">
                            →
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center lg:block">
                        <span className="mr-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 lg:hidden">
                          Source
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-600">
                          {sourceTypeLabels[meeting.sourceType] ?? meeting.sourceType}
                        </span>
                      </div>

                      <div className="flex items-center lg:block">
                        <span className="mr-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 lg:hidden">
                          Status
                        </span>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] ${getStatusTone(meeting.status)}`}
                        >
                          {statusLabels[meeting.status] ?? meeting.status}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-slate-500 lg:block">
                        <span className="mr-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 lg:hidden">
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

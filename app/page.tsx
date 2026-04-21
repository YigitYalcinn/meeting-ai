import Link from "next/link";

import { CreateMeetingForm } from "@/components/meetings/create-meeting-form";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const meetings = await prisma.meeting.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_22%),linear-gradient(180deg,#f8fbff_0%,#ffffff_45%)] px-6 py-10 text-zinc-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="grid gap-4 rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm lg:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">
              AI Meeting Summary & Action Tracker
            </p>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-950">
                Store meetings first. Build the AI workflow on top of clean data.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-zinc-600">
                This MVP dashboard handles the core flow: create a meeting,
                review saved entries, and open a detail page for each one.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl bg-zinc-950 p-5 text-white">
              <p className="text-sm text-zinc-300">Total meetings</p>
              <p className="mt-4 text-4xl font-semibold">{meetings.length}</p>
            </div>
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm text-zinc-500">Current source</p>
              <p className="mt-4 text-xl font-semibold text-zinc-950">Manual input</p>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <CreateMeetingForm />

          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-sky-700">Meeting list</p>
                <h2 className="text-2xl font-semibold text-zinc-950">
                  Saved meetings
                </h2>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-600">
                {meetings.length} items
              </span>
            </div>

            {meetings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center">
                <h3 className="text-lg font-semibold text-zinc-900">
                  No meetings yet
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Create your first meeting from the form on the left. It will
                  appear here immediately after saving.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {meetings.map((meeting) => (
                  <Link
                    key={meeting.id}
                    href={`/meetings/${meeting.id}`}
                    className="block rounded-3xl border border-zinc-200 bg-zinc-50 p-5 transition hover:border-sky-300 hover:bg-sky-50"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        {meeting.sourceType}
                      </span>
                      <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                        {meeting.status}
                      </span>
                      <span className="text-sm text-zinc-500">
                        {meeting.createdAt.toLocaleString()}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-semibold text-zinc-950">
                      {meeting.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600">
                      {meeting.summary?.trim()
                        ? meeting.summary
                        : meeting.sourceType === "audio_file"
                          ? meeting.transcript?.trim() ||
                            (meeting.status === "transcription_failed"
                              ? meeting.transcriptionError || "Transcription failed."
                              : "Audio file uploaded. Transcription is pending.")
                          : meeting.rawText?.trim() || "No meeting notes added yet."}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

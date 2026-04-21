import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

type MeetingDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MeetingDetailPage({
  params,
}: MeetingDetailPageProps) {
  const { id } = await params;

  const meeting = await prisma.meeting.findUnique({
    where: { id },
  });

  if (!meeting) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f5f9ff_0%,#ffffff_40%)] px-6 py-10 text-zinc-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <Link
            href="/"
            className="text-sm font-medium text-sky-700 transition hover:text-sky-900"
          >
            {"<- Back to dashboard"}
          </Link>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                {meeting.sourceType}
              </span>
              <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                {meeting.status}
              </span>
              <span className="text-sm text-zinc-500">
                Created {meeting.createdAt.toLocaleString()}
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">
              {meeting.title}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-zinc-600">
              This page shows the raw meeting content now. Later, this is where
              the AI summary, key discussion points, and action items will be
              displayed.
            </p>
          </div>
        </div>

        <section className="grid gap-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:grid-cols-2">
          <div className="rounded-2xl bg-zinc-50 p-5">
            <p className="text-sm text-zinc-500">Created from</p>
            <p className="mt-2 text-lg font-semibold text-zinc-950">
              {meeting.sourceType === "manual"
                ? "Manual text input"
                : meeting.sourceType === "text_file"
                  ? "Uploaded text file"
                  : "Uploaded audio file"}
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-50 p-5">
            <p className="text-sm text-zinc-500">Stored file</p>
            <p className="mt-2 text-sm font-medium text-zinc-950">
              {meeting.originalFileName || "No uploaded file"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {meeting.mimeType || "No MIME type recorded"}
            </p>
            {meeting.storedFilePath ? (
              <p className="mt-2 break-all text-xs text-zinc-500">
                {meeting.storedFilePath}
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">
              {meeting.sourceType === "audio_file"
                ? "Audio upload status"
                : "Raw meeting text"}
            </h2>
            <span className="text-sm text-zinc-500">
              {meeting.rawText ? `${meeting.rawText.length} characters` : "No text available"}
            </span>
          </div>

          <div className="rounded-2xl bg-zinc-50 p-5 text-sm leading-7 text-zinc-700">
            {meeting.sourceType === "audio_file" ? (
              <div className="space-y-3">
                <p className="font-medium text-zinc-900">
                  Transcription pending
                </p>
                <p className="text-zinc-600">
                  The audio file has been uploaded and stored locally. In a later step,
                  this meeting will move through transcription before summary and action
                  item generation.
                </p>
              </div>
            ) : meeting.rawText ? (
              <p className="whitespace-pre-wrap">{meeting.rawText}</p>
            ) : (
              <p className="text-zinc-500">
                No raw meeting text is available for this meeting.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

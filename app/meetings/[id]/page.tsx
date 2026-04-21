import Link from "next/link";
import { notFound } from "next/navigation";

import { GenerateAnalysisButton } from "@/components/meetings/generate-analysis-button";
import { GenerateTranscriptButton } from "@/components/meetings/generate-transcript-button";
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

  const keyPoints = Array.isArray(meeting.keyPoints)
    ? (meeting.keyPoints as string[])
    : [];
  const actionItems = Array.isArray(meeting.actionItems)
    ? (meeting.actionItems as {
        title: string;
        owner: string | null;
        dueDate: string | null;
      }[])
    : [];
  const sourceText =
    meeting.sourceType === "audio_file"
      ? meeting.transcript?.trim() || null
      : meeting.rawText?.trim() || null;

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
            {meeting.processedAt ? (
              <p className="mt-2 text-xs text-zinc-500">
                Processed {meeting.processedAt.toLocaleString()}
              </p>
            ) : null}
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
                ? "Audio transcript"
                : "Raw meeting text"}
            </h2>
            <span className="text-sm text-zinc-500">
              {meeting.sourceType === "audio_file"
                ? meeting.transcript
                  ? `${meeting.transcript.length} characters`
                  : "No transcript yet"
                : meeting.rawText
                  ? `${meeting.rawText.length} characters`
                  : "No text available"}
            </span>
          </div>

          <div className="rounded-2xl bg-zinc-50 p-5 text-sm leading-7 text-zinc-700">
            {meeting.sourceType === "audio_file" ? (
              <div className="space-y-3">
                {meeting.status === "pending_transcription" ? (
                  <>
                    <p className="font-medium text-zinc-900">
                      Transcription pending
                    </p>
                    <p className="text-zinc-600">
                      The audio file is ready. Generate a transcript to prepare this meeting
                      for the next AI step. In the current setup, transcription uses a free
                      local mock unless you explicitly enable OpenAI.
                    </p>
                    <GenerateTranscriptButton meetingId={meeting.id} />
                  </>
                ) : null}

                {meeting.status === "transcribing" ? (
                  <>
                    <p className="font-medium text-zinc-900">Transcribing audio</p>
                    <p className="text-zinc-600">
                      The audio file is currently being processed. Refresh the page in a
                      moment if this state does not change automatically.
                    </p>
                  </>
                ) : null}

                {meeting.status === "transcription_failed" ? (
                  <>
                    <p className="font-medium text-red-700">Transcription failed</p>
                    <p className="text-zinc-600">
                      {meeting.transcriptionError || "The transcript could not be generated."}
                    </p>
                    <GenerateTranscriptButton meetingId={meeting.id} />
                  </>
                ) : null}

                {meeting.status === "ready" && meeting.transcript ? (
                  <div className="space-y-3">
                    <p className="font-medium text-zinc-900">Transcript ready</p>
                    <p className="whitespace-pre-wrap">{meeting.transcript}</p>
                  </div>
                ) : null}
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

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">AI analysis</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Generate a summary, key points, and structured action items from the meeting content.
              </p>
            </div>
            {meeting.analyzedAt ? (
              <span className="text-sm text-zinc-500">
                Analyzed {meeting.analyzedAt.toLocaleString()}
              </span>
            ) : null}
          </div>

          <div className="space-y-5 rounded-2xl bg-zinc-50 p-5">
            {!meeting.summary && !meeting.analysisError ? (
              <div className="space-y-3">
                <p className="font-medium text-zinc-900">No analysis yet</p>
                <p className="text-zinc-600">
                  {sourceText
                    ? "This meeting is ready for AI analysis."
                    : "This meeting does not have usable text yet. Add text or generate a transcript first."}
                </p>
                {sourceText ? (
                  <GenerateAnalysisButton meetingId={meeting.id} />
                ) : null}
              </div>
            ) : null}

            {meeting.analysisError ? (
              <div className="space-y-3">
                <p className="font-medium text-red-700">Analysis failed</p>
                <p className="text-zinc-600">{meeting.analysisError}</p>
                {sourceText ? (
                  <GenerateAnalysisButton meetingId={meeting.id} />
                ) : null}
              </div>
            ) : null}

            {meeting.summary ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-zinc-950">Summary</h3>
                  <p className="whitespace-pre-wrap text-zinc-700">
                    {meeting.summary}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-zinc-950">Key points</h3>
                  {keyPoints.length > 0 ? (
                    <ul className="space-y-2 text-zinc-700">
                      {keyPoints.map((point) => (
                        <li
                          key={point}
                          className="rounded-2xl border border-zinc-200 bg-white px-4 py-3"
                        >
                          {point}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-zinc-500">No key points were returned.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-zinc-950">Action items</h3>
                  {actionItems.length > 0 ? (
                    <div className="space-y-3">
                      {actionItems.map((item, index) => (
                        <div
                          key={`${item.title}-${index}`}
                          className="rounded-2xl border border-zinc-200 bg-white px-4 py-4"
                        >
                          <p className="font-medium text-zinc-950">{item.title}</p>
                          <p className="mt-2 text-sm text-zinc-600">
                            Owner: {item.owner || "Unassigned"}
                          </p>
                          <p className="text-sm text-zinc-600">
                            Due date: {item.dueDate || "Not specified"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-500">No action items were returned.</p>
                  )}
                </div>

                <GenerateAnalysisButton meetingId={meeting.id} />
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

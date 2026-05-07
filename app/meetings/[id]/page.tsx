import Link from "next/link";
import { notFound } from "next/navigation";

import { ExportPdfButton } from "@/components/meetings/export-pdf-button";
import { GenerateAnalysisButton } from "@/components/meetings/generate-analysis-button";
import { GenerateTranscriptButton } from "@/components/meetings/generate-transcript-button";
import { getMeetingActionItems, getMeetingKeyPoints } from "@/lib/meeting-analysis";
import {
  deriveDecisionHighlights,
  deriveRiskHighlights,
} from "@/lib/meeting-insights";
import { extractMeetingMetrics } from "@/lib/meeting-metrics";
import { prisma } from "@/lib/prisma";

type MeetingDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getPointTone(point: string) {
  if (/risk|blocker|drop|delay|issue|problem|warning|critical/i.test(point)) {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  if (/\d+%|nps|rate|tickets|value|metric/i.test(point)) {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function getSourceLabel(sourceType: string) {
  if (sourceType === "manual") {
    return "Manual text";
  }

  if (sourceType === "text_file") {
    return "Text file";
  }

  if (sourceType === "audio_file") {
    return "Audio file";
  }

  return sourceType;
}

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

  const keyPoints = getMeetingKeyPoints(meeting.keyPoints);
  const actionItems = getMeetingActionItems(meeting.actionItems);
  const sourceText =
    meeting.sourceType === "audio_file"
      ? meeting.transcript?.trim() || null
      : meeting.rawText?.trim() || null;
  const metrics = extractMeetingMetrics(sourceText);
  const decisions = deriveDecisionHighlights(keyPoints);
  const risks = deriveRiskHighlights(keyPoints);
  const topMetricValue =
    metrics.length > 0
      ? Math.max(...metrics.map((metric) => metric.numericValue || 0), 1)
      : 1;
  const chartMetrics = metrics.filter((metric) => metric.numericValue !== null);

  return (
    <main className="pb-12 text-slate-950">
      <section className="border-b border-slate-200/80 bg-white/64">
        <div className="container-page py-8">
          <Link
            href="/workspace"
            className="inline-flex text-sm font-bold text-blue-700 transition hover:text-blue-900"
          >
            &lt;- Back to workspace
          </Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_21rem] lg:items-start">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-200">
                  {getSourceLabel(meeting.sourceType)}
                </span>
                <span className="rounded-lg bg-slate-950 px-3 py-1 text-xs font-black text-white">
                  {meeting.status}
                </span>
              </div>
              <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-normal text-slate-950 sm:text-5xl">
                {meeting.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Review the original source, prepare transcript text when
                needed, and turn the meeting into an executive-ready analysis.
              </p>
            </div>

            <div className="content-card p-5">
              <p className="eyebrow">Record metadata</p>
              <dl className="mt-4 grid gap-4 text-sm">
                <div>
                  <dt className="font-bold text-slate-500">Created</dt>
                  <dd className="mt-1 font-semibold text-slate-950">
                    {meeting.createdAt.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-500">File</dt>
                  <dd className="mt-1 break-words font-semibold text-slate-950">
                    {meeting.originalFileName || "No uploaded file"}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-500">MIME type</dt>
                  <dd className="mt-1 break-words font-semibold text-slate-950">
                    {meeting.mimeType || "Not recorded"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-6 py-8 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="surface rounded-2xl">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Source</p>
                <h2 className="mt-2 text-2xl font-black">
                  {meeting.sourceType === "audio_file"
                    ? "Audio transcript"
                    : "Raw meeting text"}
                </h2>
              </div>
              <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600">
                {meeting.sourceType === "audio_file"
                  ? meeting.transcript
                    ? `${meeting.transcript.length} chars`
                    : "No transcript"
                  : meeting.rawText
                    ? `${meeting.rawText.length} chars`
                    : "No text"}
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="max-h-[34rem] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
              {meeting.sourceType === "audio_file" ? (
                <div className="space-y-4">
                  {meeting.status === "pending_transcription" ? (
                    <>
                      <p className="font-black text-slate-950">
                        Transcription pending
                      </p>
                      <p>
                        The audio file is ready. Generate a transcript before
                        running the AI analysis.
                      </p>
                      <GenerateTranscriptButton meetingId={meeting.id} />
                    </>
                  ) : null}

                  {meeting.status === "transcribing" ? (
                    <>
                      <p className="font-black text-slate-950">
                        Transcribing audio
                      </p>
                      <p>
                        The audio file is currently being processed. Refresh in
                        a moment if the state does not change automatically.
                      </p>
                    </>
                  ) : null}

                  {meeting.status === "transcription_failed" ? (
                    <>
                      <p className="font-black text-rose-700">
                        Transcription failed
                      </p>
                      <p>
                        {meeting.transcriptionError ||
                          "The transcript could not be generated."}
                      </p>
                      <GenerateTranscriptButton meetingId={meeting.id} />
                    </>
                  ) : null}

                  {meeting.status === "ready" && meeting.transcript ? (
                    <p className="whitespace-pre-wrap">{meeting.transcript}</p>
                  ) : null}
                </div>
              ) : meeting.rawText ? (
                <p className="whitespace-pre-wrap">{meeting.rawText}</p>
              ) : (
                <p className="text-slate-500">
                  No raw meeting text is available for this record.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="surface rounded-2xl">
          <div className="analysis-panel-header border-b px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-200">
                  Analysis
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  Executive intelligence panel
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                  A structured readout for summary, decisions, risks, metrics,
                  and follow-up accountability.
                </p>
              </div>
              {meeting.analyzedAt ? (
                <span className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white ring-1 ring-white/15">
                  {meeting.analyzedAt.toLocaleString()}
                </span>
              ) : null}
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            {!meeting.summary && !meeting.analysisError ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <h3 className="text-xl font-black text-slate-950">
                  No analysis yet
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
                  {sourceText
                    ? "This meeting is ready for AI analysis."
                    : "This meeting needs usable text before analysis can run."}
                </p>
                {sourceText ? (
                  <div className="mt-5 flex justify-center">
                    <GenerateAnalysisButton meetingId={meeting.id} />
                  </div>
                ) : null}
              </div>
            ) : null}

            {meeting.analysisError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-5">
                <h3 className="text-lg font-black text-rose-700">
                  Analysis failed
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {meeting.analysisError}
                </p>
                {sourceText ? (
                  <div className="mt-5">
                    <GenerateAnalysisButton meetingId={meeting.id} />
                  </div>
                ) : null}
              </div>
            ) : null}

            {meeting.summary ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="surface-muted rounded-xl p-4">
                    <p className="text-sm font-bold text-slate-500">
                      Key points
                    </p>
                    <p className="mt-3 text-3xl font-black">
                      {keyPoints.length}
                    </p>
                  </div>
                  <div className="surface-muted rounded-xl p-4">
                    <p className="text-sm font-bold text-slate-500">Actions</p>
                    <p className="mt-3 text-3xl font-black">
                      {actionItems.length}
                    </p>
                  </div>
                  <div className="surface-muted rounded-xl p-4">
                    <p className="text-sm font-bold text-slate-500">Risks</p>
                    <p className="mt-3 text-3xl font-black">{risks.length}</p>
                  </div>
                </div>

                {metrics.length > 0 ? (
                  <div className="content-card overflow-hidden">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <p className="eyebrow">Metrics</p>
                      <h3 className="mt-2 text-xl font-black">
                        Extracted performance signals
                      </h3>
                    </div>
                    <div className="grid gap-4 p-5 lg:grid-cols-2">
                      {metrics.map((metric) => (
                        <div key={metric.label} className="rounded-xl bg-slate-50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-slate-950">
                                {metric.label}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {metric.context}
                              </p>
                            </div>
                            <span className="text-xl font-black text-blue-700">
                              {metric.value}
                            </span>
                          </div>
                          <div className="mt-4 h-2 rounded-full bg-slate-200">
                            <div
                              className="h-2 rounded-full bg-blue-600"
                              style={{
                                width: `${Math.max(
                                  12,
                                  ((metric.numericValue || 0) / topMetricValue) *
                                    100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    {chartMetrics.length === 0 ? (
                      <p className="border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
                        No numeric values were available for chart rendering.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="content-card overflow-hidden">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <p className="eyebrow">Executive summary</p>
                    <h3 className="mt-2 text-xl font-black">
                      High-signal meeting brief
                    </h3>
                  </div>
                  <div className="px-5 py-5">
                    <p className="whitespace-pre-wrap text-base leading-8 text-slate-700">
                      {meeting.summary}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="content-card p-5">
                    <h3 className="text-lg font-black text-slate-950">
                      Decisions
                    </h3>
                    <div className="mt-4 space-y-3">
                      {decisions.length > 0 ? (
                        decisions.map((decision, index) => (
                          <div
                            key={decision.label}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800"
                          >
                            <span className="font-black">{index + 1}. </span>
                            {decision.label}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">
                          No clear decision statements were detected.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="content-card p-5">
                    <h3 className="text-lg font-black text-slate-950">
                      Risks and blockers
                    </h3>
                    <div className="mt-4 space-y-3">
                      {risks.length > 0 ? (
                        risks.map((risk, index) => (
                          <div
                            key={risk.label}
                            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800"
                          >
                            <span className="font-black">{index + 1}. </span>
                            {risk.label}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">
                          No explicit blockers were detected.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="content-card p-5">
                  <h3 className="text-lg font-black text-slate-950">
                    Key points
                  </h3>
                  <div className="mt-4 grid gap-3">
                    {keyPoints.length > 0 ? (
                      keyPoints.map((point, index) => (
                        <div
                          key={point}
                          className={`rounded-xl border p-4 text-sm leading-6 ${getPointTone(point)}`}
                        >
                          <span className="font-black">Point {index + 1}: </span>
                          {point}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No key points were returned.
                      </p>
                    )}
                  </div>
                </div>

                <div className="content-card p-5">
                  <h3 className="text-lg font-black text-slate-950">
                    Action items
                  </h3>
                  <div className="mt-4 grid gap-3">
                    {actionItems.length > 0 ? (
                      actionItems.map((item, index) => (
                        <div
                          key={`${item.title}-${index}`}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <p className="max-w-2xl text-sm font-black leading-6 text-slate-950">
                              {item.title}
                            </p>
                            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-200">
                              Open
                            </span>
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                                Owner
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-950">
                                {item.owner || "Unassigned"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                                Due date
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-950">
                                {item.dueDate || "Not specified"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No action items were returned.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <GenerateAnalysisButton meetingId={meeting.id} />
                  <ExportPdfButton
                    meetingId={meeting.id}
                    meetingTitle={meeting.title}
                  />
                </div>
              </>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

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
    return {
      label: "Risk",
      badgeClass: "bg-rose-100 text-rose-700",
      dotClass: "bg-rose-500",
    };
  }

  if (/\d+%|nps|rate|tickets|value|metric/i.test(point)) {
    return {
      label: "Metric",
      badgeClass: "bg-cyan-100 text-cyan-800",
      dotClass: "bg-cyan-600",
    };
  }

  return {
    label: "Focus",
    badgeClass: "bg-emerald-100 text-emerald-700",
    dotClass: "bg-emerald-500",
  };
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
  const analyzedLabel = meeting.analyzedAt
    ? meeting.analyzedAt.toLocaleString()
    : null;
  const chartMetrics = metrics.filter((metric) => metric.numericValue !== null);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#edf3f8_0%,#f8fbfd_35%,#ffffff_100%)] px-6 py-10 text-zinc-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="rounded-[32px] border border-[#d6dce6] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <Link
            href="/workspace"
            className="text-sm font-medium text-sky-700 transition hover:text-sky-900"
          >
            {"<- Back to workspace"}
          </Link>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-4">
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

              <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">
                {meeting.title}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-zinc-600">
                This page combines the original meeting content with a cleaner,
                more executive analysis view designed for product, operations,
                and leadership review.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[28px] border border-zinc-200 bg-zinc-50 px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Created From
                </p>
                <p className="mt-3 text-lg font-semibold text-zinc-950">
                  {meeting.sourceType === "manual"
                    ? "Manual text input"
                    : meeting.sourceType === "text_file"
                      ? "Uploaded text file"
                      : "Uploaded audio file"}
                </p>
              </div>

              <div className="rounded-[28px] border border-zinc-200 bg-zinc-50 px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Stored File
                </p>
                <p className="mt-3 text-sm font-medium text-zinc-950">
                  {meeting.originalFileName || "No uploaded file"}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  {meeting.mimeType || "No MIME type recorded"}
                </p>
                {meeting.processedAt ? (
                  <p className="mt-2 text-xs text-zinc-500">
                    Processed {meeting.processedAt.toLocaleString()}
                  </p>
                ) : null}
                {meeting.storedFilePath ? (
                  <p className="mt-3 break-all text-xs leading-5 text-zinc-500">
                    {meeting.storedFilePath}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-[32px] border border-[#d6dce6] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
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

          <div className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-5 text-sm leading-7 text-zinc-700">
            {meeting.sourceType === "audio_file" ? (
              <div className="space-y-3">
                {meeting.status === "pending_transcription" ? (
                  <>
                    <p className="font-medium text-zinc-900">
                      Transcription pending
                    </p>
                    <p className="text-zinc-600">
                      The audio file is ready. Generate a transcript to prepare
                      this meeting for the next AI step.
                    </p>
                    <GenerateTranscriptButton meetingId={meeting.id} />
                  </>
                ) : null}

                {meeting.status === "transcribing" ? (
                  <>
                    <p className="font-medium text-zinc-900">Transcribing audio</p>
                    <p className="text-zinc-600">
                      The audio file is currently being processed. Refresh in a
                      moment if this state does not change automatically.
                    </p>
                  </>
                ) : null}

                {meeting.status === "transcription_failed" ? (
                  <>
                    <p className="font-medium text-red-700">
                      Transcription failed
                    </p>
                    <p className="text-zinc-600">
                      {meeting.transcriptionError ||
                        "The transcript could not be generated."}
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

        <section className="overflow-hidden rounded-[36px] border border-[#d6dce6] bg-[linear-gradient(180deg,#fbfcfe_0%,#f4f7fb_100%)] shadow-[0_28px_70px_rgba(15,23,42,0.08)]">
          <div className="border-b border-[#d6dce6] bg-[linear-gradient(135deg,#0f172a_0%,#16344f_58%,#0f766e_100%)] px-6 py-7 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
                  Analysis Console
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                  Premium meeting intelligence panel
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
                  Built to present the whole meeting clearly with better visual
                  hierarchy, cleaner cards, and a stronger executive readout.
                </p>
              </div>
              {analyzedLabel ? (
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                    Last Analysis
                  </p>
                  <p className="mt-2 text-sm text-white">{analyzedLabel}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-7 p-6">
            {!meeting.summary && !meeting.analysisError ? (
              <div className="rounded-[30px] border border-dashed border-[#cfd7e1] bg-white px-6 py-10 text-center shadow-sm">
                <p className="text-lg font-semibold text-zinc-950">
                  No analysis yet
                </p>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-600">
                  {sourceText
                    ? "This meeting is ready for AI analysis."
                    : "This meeting does not have usable text yet. Add text or generate a transcript first."}
                </p>
                {sourceText ? (
                  <div className="mt-5">
                    <GenerateAnalysisButton meetingId={meeting.id} />
                  </div>
                ) : null}
              </div>
            ) : null}

            {meeting.analysisError ? (
              <div className="rounded-[30px] border border-rose-200 bg-rose-50 px-6 py-6 shadow-sm">
                <p className="text-lg font-semibold text-rose-700">
                  Analysis failed
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-700">
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
              <div className="space-y-8">
                {metrics.length > 0 ? (
                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {metrics.map((metric) => (
                        <div
                          key={metric.label}
                          className="overflow-hidden rounded-[28px] border border-[#d8e2ec] bg-white shadow-[0_18px_36px_rgba(15,23,42,0.06)]"
                        >
                          <div className="h-1.5 bg-[linear-gradient(90deg,#0f766e_0%,#0ea5e9_100%)]" />
                          <div className="px-5 py-5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                              {metric.label}
                            </p>
                            <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
                              {metric.value}
                            </p>
                            <div className="mt-4 h-2 rounded-full bg-zinc-100">
                              <div
                                className="h-2 rounded-full bg-[linear-gradient(90deg,#0f766e_0%,#0ea5e9_100%)]"
                                style={{
                                  width: `${Math.max(
                                    16,
                                    ((metric.numericValue || 0) / topMetricValue) *
                                      100,
                                  )}%`,
                                }}
                              />
                            </div>
                            <p className="mt-4 text-xs leading-5 text-zinc-500">
                              {metric.context}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                      <div className="overflow-hidden rounded-[30px] border border-[#d8e2ec] bg-white shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
                        <div className="border-b border-zinc-200 px-5 py-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                            Metric Chart
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-zinc-950">
                            Source data visualization
                          </h3>
                          <p className="mt-1 text-sm text-zinc-500">
                            Bars are drawn directly from the numeric values found in the meeting content.
                          </p>
                        </div>

                        {chartMetrics.length > 0 ? (
                          <div className="space-y-4 px-5 py-5">
                            {chartMetrics.map((metric) => (
                              <div key={metric.label} className="space-y-2">
                                <div className="flex items-end justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-zinc-950">
                                      {metric.label}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                      {metric.context}
                                    </p>
                                  </div>
                                  <span className="text-sm font-semibold text-zinc-700">
                                    {metric.value}
                                  </span>
                                </div>
                                <div className="h-3 rounded-full bg-zinc-100">
                                  <div
                                    className="h-3 rounded-full bg-[linear-gradient(90deg,#0f766e_0%,#0ea5e9_100%)]"
                                    style={{
                                      width: `${Math.max(
                                        10,
                                        ((metric.numericValue || 0) / topMetricValue) *
                                          100,
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-5 py-6">
                            <p className="text-sm text-zinc-500">
                              No numeric metrics were detected in this meeting, so a chart could not be generated.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="overflow-hidden rounded-[30px] border border-[#d8e2ec] bg-white shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
                        <div className="border-b border-zinc-200 px-5 py-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                            Metric Table
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-zinc-950">
                            Extracted values
                          </h3>
                          <p className="mt-1 text-sm text-zinc-500">
                            Only values parsed from the meeting text are listed here.
                          </p>
                        </div>
                        <div className="divide-y divide-zinc-200">
                          <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,0.55fr)] gap-3 bg-zinc-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                            <span>Metric</span>
                            <span>Value</span>
                          </div>
                          {metrics.map((metric) => (
                            <div
                              key={metric.label}
                              className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,0.55fr)] gap-3 px-5 py-4"
                            >
                              <div>
                                <p className="text-sm font-semibold text-zinc-950">
                                  {metric.label}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-zinc-500">
                                  {metric.context}
                                </p>
                              </div>
                              <div className="pt-1 text-sm font-semibold text-zinc-700">
                                {metric.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="overflow-hidden rounded-[34px] border border-[#d7dee7] bg-white shadow-[0_26px_60px_rgba(15,23,42,0.08)]">
                  <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="bg-[linear-gradient(135deg,#0f172a_0%,#173b59_58%,#0f766e_100%)] px-7 py-7 text-white">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
                        Executive Summary
                      </p>
                      <h3 className="mt-4 text-[2rem] font-semibold leading-tight tracking-tight">
                        Clean, high-signal meeting brief
                      </h3>
                      <p className="mt-4 max-w-lg text-sm leading-6 text-slate-200">
                        A refined overview for founders, product leads, and
                        operators who need the full picture quickly.
                      </p>
                    </div>
                    <div className="grid gap-3 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-6 py-6">
                      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Key Points
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-zinc-950">
                          {keyPoints.length}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Actions
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-zinc-950">
                          {actionItems.length}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Risks
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-zinc-950">
                          {risks.length}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-[#d7dee7] bg-[linear-gradient(180deg,#ffffff_0%,#f9fbfd_100%)] px-7 py-7">
                    <p className="whitespace-pre-wrap text-[16px] leading-8 text-zinc-700">
                      {meeting.summary}
                    </p>
                  </div>
                </div>

                {decisions.length > 0 || risks.length > 0 ? (
                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="overflow-hidden rounded-[30px] border border-emerald-200 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
                      <div className="border-b border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#f7fffb_100%)] px-5 py-5">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-semibold text-white">
                            OK
                          </span>
                          <div>
                            <h3 className="text-xl font-semibold text-zinc-950">
                              Decisions
                            </h3>
                            <p className="text-sm text-zinc-500">
                              The most important aligned choices
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 px-5 py-5">
                        {decisions.length > 0 ? (
                          decisions.map((decision, index) => (
                            <div
                              key={decision.label}
                              className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-4"
                            >
                              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-emerald-700 shadow-sm">
                                {index + 1}
                              </span>
                              <p className="text-sm leading-6 text-zinc-700">
                                {decision.label}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-zinc-500">
                            No clear decision statements were detected.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-[30px] border border-rose-200 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
                      <div className="border-b border-rose-100 bg-[linear-gradient(135deg,#fff1f2_0%,#fff7f7_100%)] px-5 py-5">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-600 text-base font-semibold text-white">
                            !
                          </span>
                          <div>
                            <h3 className="text-xl font-semibold text-zinc-950">
                              Risks & blockers
                            </h3>
                            <p className="text-sm text-zinc-500">
                              Issues that could impact execution
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 px-5 py-5">
                        {risks.length > 0 ? (
                          risks.map((risk, index) => (
                            <div
                              key={risk.label}
                              className="flex gap-3 rounded-2xl border border-rose-100 bg-rose-50/70 px-4 py-4"
                            >
                              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-rose-700 shadow-sm">
                                {index + 1}
                              </span>
                              <p className="text-sm leading-6 text-zinc-700">
                                {risk.label}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-zinc-500">
                            No explicit blockers were detected in the analysis.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0f172a] text-sm font-semibold text-white">
                      KP
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold text-zinc-950">
                        Key points
                      </h3>
                      <p className="text-sm text-zinc-500">
                        Curated highlights with stronger visual separation
                      </p>
                    </div>
                  </div>
                  {keyPoints.length > 0 ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {keyPoints.map((point, index) => {
                        const tone = getPointTone(point);

                        return (
                          <div
                            key={point}
                            className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.05)]"
                          >
                            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
                              <div className="flex items-center gap-3">
                                <span className={`h-2.5 w-2.5 rounded-full ${tone.dotClass}`} />
                                <span className="text-sm font-semibold text-zinc-950">
                                  Point {index + 1}
                                </span>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tone.badgeClass}`}>
                                {tone.label}
                              </span>
                            </div>
                            <div className="px-5 py-5">
                              <p className="text-sm leading-7 text-zinc-700">
                                {point}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-zinc-500">No key points were returned.</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0f766e] text-sm font-semibold text-white">
                      AC
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold text-zinc-950">
                        Action items
                      </h3>
                      <p className="text-sm text-zinc-500">
                        Follow-up tasks shown in a cleaner showcase grid
                      </p>
                    </div>
                  </div>
                  {actionItems.length > 0 ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {actionItems.map((item, index) => (
                        <div
                          key={`${item.title}-${index}`}
                          className="overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-[0_20px_40px_rgba(15,23,42,0.05)]"
                        >
                          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sm font-semibold text-sky-700">
                                {index + 1}
                              </span>
                              <span className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
                                Action Item
                              </span>
                            </div>
                            <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-700">
                              Open
                            </span>
                          </div>
                          <div className="space-y-4 px-5 py-5">
                            <p className="text-base font-medium leading-7 text-zinc-900">
                              {item.title}
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="rounded-2xl bg-zinc-50 px-4 py-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                  Owner
                                </p>
                                <p className="mt-2 text-sm font-medium text-zinc-900">
                                  {item.owner || "Unassigned"}
                                </p>
                              </div>
                              <div className="rounded-2xl bg-zinc-50 px-4 py-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                  Due Date
                                </p>
                                <p className="mt-2 text-sm font-medium text-zinc-900">
                                  {item.dueDate || "Not specified"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-500">No action items were returned.</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <GenerateAnalysisButton meetingId={meeting.id} />
                  <ExportPdfButton
                    meetingId={meeting.id}
                    meetingTitle={meeting.title}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

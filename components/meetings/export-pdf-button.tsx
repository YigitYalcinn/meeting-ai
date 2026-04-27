"use client";

type ExportPdfButtonProps = {
  meetingId: string;
  meetingTitle: string;
};

function buildPdfFilename(meetingTitle: string) {
  const safeTitle = meetingTitle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeTitle || "meeting"}-report.pdf`;
}

export function ExportPdfButton({
  meetingId,
  meetingTitle,
}: ExportPdfButtonProps) {
  return (
    <a
      href={`/api/meetings/${meetingId}/export`}
      download={buildPdfFilename(meetingTitle)}
      className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-900 transition hover:border-zinc-950 hover:bg-zinc-50"
    >
      Export PDF
    </a>
  );
}

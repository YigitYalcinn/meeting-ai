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
      className="btn-secondary"
    >
      Export PDF
    </a>
  );
}

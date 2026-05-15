import { readFile } from "node:fs/promises";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";

import { getCurrentUser } from "@/lib/auth";
import { getMeetingActionItems, getMeetingKeyPoints } from "@/lib/meeting-analysis";
import {
  deriveDecisionHighlights,
  deriveRiskHighlights,
} from "@/lib/meeting-insights";
import { extractMeetingMetrics } from "@/lib/meeting-metrics";
import { prisma } from "@/lib/prisma";

type MeetingExportRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

type PdfMeetingReport = {
  title: string;
  sourceType: string;
  status: string;
  originalFileName: string | null;
  sourceText: string | null;
  summary: string;
  analyzedAt: Date | null;
  keyPoints: string[];
  actionItems: ReturnType<typeof getMeetingActionItems>;
};

type PdfFont = Awaited<ReturnType<PDFDocument["embedFont"]>>;

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const TOP_START = PAGE_HEIGHT - PAGE_MARGIN;
const BOTTOM_LIMIT = 44;
const REGULAR_FONT_PATH = new URL(
  "../../../../../public/fonts/arial.ttf",
  import.meta.url,
);
const BOLD_FONT_PATH = new URL(
  "../../../../../public/fonts/arialbd.ttf",
  import.meta.url,
);

const COLORS = {
  background: rgb(247 / 255, 249 / 255, 252 / 255),
  white: rgb(1, 1, 1),
  ink: rgb(15 / 255, 23 / 255, 42 / 255),
  body: rgb(51 / 255, 65 / 255, 85 / 255),
  muted: rgb(100 / 255, 116 / 255, 139 / 255),
  line: rgb(226 / 255, 232 / 255, 240 / 255),
  accent: rgb(14 / 255, 116 / 255, 144 / 255),
  accentDark: rgb(8 / 255, 47 / 255, 73 / 255),
  accentSoft: rgb(236 / 255, 254 / 255, 255 / 255),
  emerald: rgb(5 / 255, 150 / 255, 105 / 255),
  emeraldSoft: rgb(236 / 255, 253 / 255, 245 / 255),
  rose: rgb(225 / 255, 29 / 255, 72 / 255),
  roseSoft: rgb(255 / 255, 241 / 255, 242 / 255),
};

function sanitizeFilename(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(value: Date | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatSourceType(sourceType: string) {
  if (sourceType === "manual") {
    return "Manual Text";
  }

  if (sourceType === "text_file") {
    return "Text File Upload";
  }

  if (sourceType === "audio_file") {
    return "Audio Upload";
  }

  return sourceType;
}

async function createPdfReport(meeting: PdfMeetingReport) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const regularFont = await pdfDoc.embedFont(await readFile(REGULAR_FONT_PATH));
  const boldFont = await pdfDoc.embedFont(await readFile(BOLD_FONT_PATH));
  const metrics = extractMeetingMetrics(meeting.sourceText);
  const decisions = deriveDecisionHighlights(meeting.keyPoints);
  const risks = deriveRiskHighlights(meeting.keyPoints);
  const analyzedLabel = formatDate(meeting.analyzedAt) || "Not analyzed yet";

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let cursorY = TOP_START;
  let pageNumber = 1;

  const splitTextIntoLines = (
    text: string,
    font: PdfFont,
    fontSize: number,
    maxWidth: number,
  ) => {
    const paragraphs = text.replace(/\r/g, "").split("\n");
    const lines: string[] = [];

    paragraphs.forEach((paragraph) => {
      const trimmed = paragraph.trim();

      if (!trimmed) {
        lines.push("");
        return;
      }

      const words = trimmed.split(/\s+/);
      let currentLine = words[0] || "";

      for (let index = 1; index < words.length; index += 1) {
        const nextLine = `${currentLine} ${words[index]}`;

        if (font.widthOfTextAtSize(nextLine, fontSize) <= maxWidth) {
          currentLine = nextLine;
        } else {
          lines.push(currentLine);
          currentLine = words[index];
        }
      }

      lines.push(currentLine);
    });

    return lines;
  };

  const drawPageBackground = () => {
    page.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      color: COLORS.background,
    });
  };

  const drawFooter = () => {
    page.drawLine({
      start: { x: PAGE_MARGIN, y: 30 },
      end: { x: PAGE_WIDTH - PAGE_MARGIN, y: 30 },
      thickness: 1,
      color: COLORS.line,
    });

    page.drawText("AI Meeting Summary & Action Tracker", {
      x: PAGE_MARGIN,
      y: 15,
      size: 9,
      font: regularFont,
      color: COLORS.muted,
    });

    page.drawText(`Page ${pageNumber}`, {
      x: PAGE_WIDTH - PAGE_MARGIN - 34,
      y: 15,
      size: 9,
      font: regularFont,
      color: COLORS.muted,
    });
  };

  const startNewPage = () => {
    drawFooter();
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pageNumber += 1;
    drawPageBackground();
    cursorY = TOP_START;
  };

  const ensureSpace = (requiredHeight: number) => {
    if (cursorY - requiredHeight >= BOTTOM_LIMIT) {
      return;
    }

    startNewPage();
  };

  const drawWrappedText = (
    text: string,
    options: {
      x?: number;
      y?: number;
      width?: number;
      font: PdfFont;
      fontSize: number;
      color: ReturnType<typeof rgb>;
      lineGap?: number;
    },
  ) => {
    const x = options.x ?? PAGE_MARGIN;
    const width = options.width ?? CONTENT_WIDTH;
    const lineGap = options.lineGap ?? 5;
    const lines = splitTextIntoLines(text, options.font, options.fontSize, width);
    let localY = options.y ?? cursorY;

    lines.forEach((line) => {
      if (options.y === undefined) {
        ensureSpace(options.fontSize + lineGap);
        localY = cursorY;
      }

      if (line) {
        page.drawText(line, {
          x,
          y: localY - options.fontSize,
          size: options.fontSize,
          font: options.font,
          color: options.color,
        });
      }

      localY -= options.fontSize + lineGap;

      if (options.y === undefined) {
        cursorY = localY;
      }
    });

    return localY;
  };

  const drawSectionHeader = (
    eyebrow: string,
    title: string,
    description?: string,
  ) => {
    ensureSpace(56);

    page.drawText(eyebrow.toUpperCase(), {
      x: PAGE_MARGIN,
      y: cursorY - 10,
      size: 9,
      font: boldFont,
      color: COLORS.accent,
    });

    page.drawText(title, {
      x: PAGE_MARGIN,
      y: cursorY - 30,
      size: 19,
      font: boldFont,
      color: COLORS.ink,
    });

    if (description) {
      page.drawText(description, {
        x: PAGE_MARGIN,
        y: cursorY - 46,
        size: 10,
        font: regularFont,
        color: COLORS.muted,
      });
      cursorY -= 58;
      return;
    }

    cursorY -= 40;
  };

  const drawCoverPage = () => {
    page.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      color: COLORS.accentDark,
    });

    page.drawRectangle({
      x: PAGE_MARGIN,
      y: PAGE_HEIGHT - 196,
      width: CONTENT_WIDTH,
      height: 132,
      color: COLORS.accent,
      opacity: 0.18,
    });

    page.drawText("MEETING INTELLIGENCE REPORT", {
      x: PAGE_MARGIN,
      y: PAGE_HEIGHT - 86,
      size: 11,
      font: boldFont,
      color: rgb(186 / 255, 230 / 255, 253 / 255),
    });

    drawWrappedText(meeting.title, {
      x: PAGE_MARGIN,
      y: PAGE_HEIGHT - 118,
      width: CONTENT_WIDTH - 80,
      font: boldFont,
      fontSize: 28,
      color: COLORS.white,
      lineGap: 8,
    });

    drawWrappedText(
      "A clean executive brief generated from the saved meeting analysis.",
      {
        x: PAGE_MARGIN,
        y: PAGE_HEIGHT - 220,
        width: 340,
        font: regularFont,
        fontSize: 11,
        color: rgb(226 / 255, 232 / 255, 240 / 255),
        lineGap: 6,
      },
    );

    const metaY = PAGE_HEIGHT - 276;
    const meta = [
      `Source: ${formatSourceType(meeting.sourceType)}`,
      `Status: ${meeting.status}`,
      `Analyzed: ${analyzedLabel}`,
    ];

    meta.forEach((item, index) => {
      page.drawRectangle({
        x: PAGE_MARGIN + index * 160,
        y: metaY,
        width: 148,
        height: 26,
        color: rgb(255 / 255, 255 / 255, 255 / 255),
        opacity: 0.94,
      });

      page.drawText(item, {
        x: PAGE_MARGIN + 10 + index * 160,
        y: metaY + 8,
        size: 8,
        font: boldFont,
        color: COLORS.accentDark,
      });
    });

    const previewHeight = 176;
    page.drawRectangle({
      x: PAGE_MARGIN,
      y: 164,
      width: CONTENT_WIDTH,
      height: previewHeight,
      color: rgb(255 / 255, 255 / 255, 255 / 255),
      opacity: 0.98,
    });

    page.drawText("Executive Snapshot", {
      x: PAGE_MARGIN + 18,
      y: 320,
      size: 10,
      font: boldFont,
      color: COLORS.accent,
    });

    const previewSummary = splitTextIntoLines(
      meeting.summary,
      regularFont,
      12,
      CONTENT_WIDTH - 36,
    )
      .slice(0, 5)
      .join(" ");

    drawWrappedText(previewSummary, {
      x: PAGE_MARGIN + 18,
      y: 298,
      width: CONTENT_WIDTH - 36,
      font: regularFont,
      fontSize: 12,
      color: COLORS.body,
      lineGap: 6,
    });
  };

  const drawReportHeader = () => {
    page.drawRectangle({
      x: PAGE_MARGIN,
      y: cursorY - 84,
      width: CONTENT_WIDTH,
      height: 84,
      color: COLORS.white,
      borderColor: COLORS.line,
      borderWidth: 1,
    });

    page.drawText("Analysis Report", {
      x: PAGE_MARGIN + 18,
      y: cursorY - 22,
      size: 10,
      font: boldFont,
      color: COLORS.accent,
    });

    page.drawText(meeting.title, {
      x: PAGE_MARGIN + 18,
      y: cursorY - 48,
      size: 21,
      font: boldFont,
      color: COLORS.ink,
    });

    page.drawText(analyzedLabel, {
      x: PAGE_WIDTH - PAGE_MARGIN - 110,
      y: cursorY - 26,
      size: 10,
      font: regularFont,
      color: COLORS.muted,
    });

    cursorY -= 100;
  };

  const drawMetaCards = () => {
    const items = [
      { label: "Source Type", value: formatSourceType(meeting.sourceType) },
      { label: "Meeting Status", value: meeting.status },
      { label: "File Reference", value: meeting.originalFileName || "N/A" },
    ];
    const cardWidth = (CONTENT_WIDTH - 16) / 3;
    const cardHeight = 76;

    ensureSpace(cardHeight + 18);

    items.forEach((item, index) => {
      const x = PAGE_MARGIN + index * (cardWidth + 8);

      page.drawRectangle({
        x,
        y: cursorY - cardHeight,
        width: cardWidth,
        height: cardHeight,
        color: COLORS.white,
        borderColor: COLORS.line,
        borderWidth: 1,
      });

      page.drawText(item.label.toUpperCase(), {
        x: x + 14,
        y: cursorY - 18,
        size: 8,
        font: boldFont,
        color: COLORS.muted,
      });

      const lines = splitTextIntoLines(item.value, boldFont, 12, cardWidth - 28);
      lines.slice(0, 2).forEach((line, lineIndex) => {
        page.drawText(line, {
          x: x + 14,
          y: cursorY - 44 - lineIndex * 14,
          size: 12,
          font: boldFont,
          color: COLORS.ink,
        });
      });
    });

    cursorY -= cardHeight + 18;
  };

  const drawSummaryPanel = () => {
    drawSectionHeader(
      "Executive Summary",
      "Summary",
      "A clean overview of the meeting context, decisions, and next steps.",
    );

    const lines = splitTextIntoLines(meeting.summary, regularFont, 12, CONTENT_WIDTH - 40);
    const panelHeight = Math.max(120, lines.length * 18 + 34);

    ensureSpace(panelHeight + 18);

    page.drawRectangle({
      x: PAGE_MARGIN,
      y: cursorY - panelHeight,
      width: CONTENT_WIDTH,
      height: panelHeight,
      color: COLORS.white,
      borderColor: COLORS.line,
      borderWidth: 1,
    });

    page.drawRectangle({
      x: PAGE_MARGIN,
      y: cursorY - panelHeight,
      width: 8,
      height: panelHeight,
      color: COLORS.accent,
    });

    lines.forEach((line, index) => {
      page.drawText(line, {
        x: PAGE_MARGIN + 22,
        y: cursorY - 22 - index * 18,
        size: 12,
        font: regularFont,
        color: COLORS.body,
      });
    });

    cursorY -= panelHeight + 18;
  };

  const drawMetricsSection = () => {
    if (metrics.length === 0) {
      return;
    }

    drawSectionHeader(
      "Performance Signals",
      "Metrics",
      "Only values parsed directly from the meeting source are included.",
    );

    const cards = metrics.slice(0, 4);
    const cardWidth = (CONTENT_WIDTH - 18) / 4;
    const cardHeight = 82;

    ensureSpace(cardHeight + 18);

    cards.forEach((metric, index) => {
      const x = PAGE_MARGIN + index * (cardWidth + 6);
      const accent = [COLORS.accent, COLORS.emerald, COLORS.rose, COLORS.accentDark][
        index % 4
      ];

      page.drawRectangle({
        x,
        y: cursorY - cardHeight,
        width: cardWidth,
        height: cardHeight,
        color: COLORS.white,
        borderColor: COLORS.line,
        borderWidth: 1,
      });

      page.drawRectangle({
        x,
        y: cursorY - 4,
        width: cardWidth,
        height: 4,
        color: accent,
      });

      page.drawText(metric.label.toUpperCase(), {
        x: x + 12,
        y: cursorY - 18,
        size: 7,
        font: boldFont,
        color: COLORS.muted,
      });

      page.drawText(metric.value, {
        x: x + 12,
        y: cursorY - 46,
        size: 20,
        font: boldFont,
        color: COLORS.ink,
      });

      page.drawText(metric.context, {
        x: x + 12,
        y: cursorY - 62,
        size: 8,
        font: regularFont,
        color: COLORS.muted,
      });
    });

    cursorY -= cardHeight + 18;

    const numericMetrics = cards.filter((metric) => metric.numericValue !== null);

    if (numericMetrics.length > 0) {
      const maxValue = Math.max(
        ...numericMetrics.map((metric) => metric.numericValue || 0),
        1,
      );
      const rowHeight = 34;
      const chartHeight = 48 + numericMetrics.length * rowHeight;

      ensureSpace(chartHeight + 18);

      page.drawRectangle({
        x: PAGE_MARGIN,
        y: cursorY - chartHeight,
        width: CONTENT_WIDTH,
        height: chartHeight,
        color: COLORS.white,
        borderColor: COLORS.line,
        borderWidth: 1,
      });

      page.drawText("Metric Chart", {
        x: PAGE_MARGIN + 14,
        y: cursorY - 18,
        size: 11,
        font: boldFont,
        color: COLORS.ink,
      });

      page.drawText("Relative values from the source meeting data", {
        x: PAGE_MARGIN + 14,
        y: cursorY - 32,
        size: 8,
        font: regularFont,
        color: COLORS.muted,
      });

      numericMetrics.forEach((metric, index) => {
        const yTop = cursorY - 54 - index * rowHeight;
        const barX = PAGE_MARGIN + 170;
        const barWidth = 220;
        const fillWidth = Math.max(
          18,
          ((metric.numericValue || 0) / maxValue) * barWidth,
        );
        const color = [COLORS.accent, COLORS.emerald, COLORS.rose, COLORS.accentDark][
          index % 4
        ];

        page.drawText(metric.label, {
          x: PAGE_MARGIN + 14,
          y: yTop - 9,
          size: 8,
          font: boldFont,
          color: COLORS.body,
        });

        page.drawRectangle({
          x: barX,
          y: yTop - 12,
          width: barWidth,
          height: 12,
          color: COLORS.background,
        });

        page.drawRectangle({
          x: barX,
          y: yTop - 12,
          width: fillWidth,
          height: 12,
          color,
        });

        page.drawText(metric.value, {
          x: barX + barWidth + 12,
          y: yTop - 9,
          size: 8,
          font: boldFont,
          color: COLORS.ink,
        });
      });

      cursorY -= chartHeight + 18;

      const tableRowHeight = 30;
      const tableHeight = 42 + numericMetrics.length * tableRowHeight;

      ensureSpace(tableHeight + 18);

      page.drawRectangle({
        x: PAGE_MARGIN,
        y: cursorY - tableHeight,
        width: CONTENT_WIDTH,
        height: tableHeight,
        color: COLORS.white,
        borderColor: COLORS.line,
        borderWidth: 1,
      });

      page.drawText("Metric Table", {
        x: PAGE_MARGIN + 14,
        y: cursorY - 18,
        size: 11,
        font: boldFont,
        color: COLORS.ink,
      });

      let rowY = cursorY - 42;
      numericMetrics.forEach((metric, index) => {
        page.drawRectangle({
          x: PAGE_MARGIN + 12,
          y: rowY - tableRowHeight,
          width: CONTENT_WIDTH - 24,
          height: tableRowHeight,
          color: index % 2 === 0 ? COLORS.background : COLORS.white,
        });

        page.drawText(metric.label, {
          x: PAGE_MARGIN + 20,
          y: rowY - 18,
          size: 8,
          font: regularFont,
          color: COLORS.body,
        });

        page.drawText(metric.value, {
          x: PAGE_WIDTH - PAGE_MARGIN - 60,
          y: rowY - 18,
          size: 8,
          font: boldFont,
          color: COLORS.ink,
        });

        rowY -= tableRowHeight;
      });

      cursorY -= tableHeight + 18;
    }
  };

  const drawInsightRow = () => {
    if (decisions.length === 0 && risks.length === 0) {
      return;
    }

    drawSectionHeader(
      "Leadership Readout",
      "Decisions and Risks",
      "A quick scan of alignment and blockers extracted from the meeting.",
    );

    const columnWidth = (CONTENT_WIDTH - 12) / 2;
    const decisionLines = decisions
      .slice(0, 3)
      .reduce(
        (count, item) =>
          count +
          Math.max(
            1,
            splitTextIntoLines(item.label, regularFont, 8, columnWidth - 42).length,
          ),
        0,
      );
    const riskLines = risks
      .slice(0, 3)
      .reduce(
        (count, item) =>
          count +
          Math.max(
            1,
            splitTextIntoLines(item.label, regularFont, 8, columnWidth - 42).length,
          ),
        0,
      );
    const cardHeight =
      Math.max(108, Math.max(decisionLines, riskLines) * 12 + 54);

    ensureSpace(cardHeight + 18);

    const drawInsightCard = (
      x: number,
      title: string,
      items: { label: string }[],
      background: ReturnType<typeof rgb>,
      accent: ReturnType<typeof rgb>,
    ) => {
      page.drawRectangle({
        x,
        y: cursorY - cardHeight,
        width: columnWidth,
        height: cardHeight,
        color: background,
        borderColor: COLORS.line,
        borderWidth: 1,
      });

      page.drawRectangle({
        x,
        y: cursorY - cardHeight,
        width: 6,
        height: cardHeight,
        color: accent,
      });

      page.drawText(title, {
        x: x + 16,
        y: cursorY - 22,
        size: 13,
        font: boldFont,
        color: COLORS.ink,
      });

      if (items.length === 0) {
        page.drawText("No items detected.", {
          x: x + 16,
          y: cursorY - 48,
          size: 9,
          font: regularFont,
          color: COLORS.muted,
        });
        return;
      }

      items.slice(0, 3).forEach((item, index) => {
        const itemY = cursorY - 50 - index * 28;
        const lines = splitTextIntoLines(item.label, regularFont, 8, columnWidth - 42);

        page.drawRectangle({
          x: x + 16,
          y: itemY - 4,
          width: 9,
          height: 9,
          color: accent,
        });

        lines.slice(0, 2).forEach((line, lineIndex) => {
          page.drawText(line, {
            x: x + 32,
            y: itemY - lineIndex * 9,
            size: 8,
            font: regularFont,
            color: COLORS.body,
          });
        });
      });
    };

    drawInsightCard(
      PAGE_MARGIN,
      "Decisions",
      decisions,
      COLORS.emeraldSoft,
      COLORS.emerald,
    );
    drawInsightCard(
      PAGE_MARGIN + columnWidth + 12,
      "Risks & blockers",
      risks,
      COLORS.roseSoft,
      COLORS.rose,
    );

    cursorY -= cardHeight + 18;
  };

  const drawKeyPoints = () => {
    drawSectionHeader(
      "Discussion Breakdown",
      "Key Points",
      "Important takeaways extracted from the generated analysis.",
    );

    meeting.keyPoints.forEach((point, index) => {
      const lines = splitTextIntoLines(point, regularFont, 10, CONTENT_WIDTH - 74);
      const boxHeight = Math.max(58, lines.length * 14 + 18);

      ensureSpace(boxHeight + 10);

      page.drawRectangle({
        x: PAGE_MARGIN,
        y: cursorY - boxHeight,
        width: CONTENT_WIDTH,
        height: boxHeight,
        color: COLORS.white,
        borderColor: COLORS.line,
        borderWidth: 1,
      });

      page.drawRectangle({
        x: PAGE_MARGIN + 14,
        y: cursorY - 34,
        width: 28,
        height: 28,
        color: COLORS.accentSoft,
      });

      page.drawText(String(index + 1), {
        x: PAGE_MARGIN + 24,
        y: cursorY - 25,
        size: 10,
        font: boldFont,
        color: COLORS.accentDark,
      });

      lines.forEach((line, lineIndex) => {
        page.drawText(line, {
          x: PAGE_MARGIN + 56,
          y: cursorY - 22 - lineIndex * 14,
          size: 10,
          font: regularFont,
          color: COLORS.body,
        });
      });

      cursorY -= boxHeight + 10;
    });
  };

  const drawActionItemsTable = () => {
    drawSectionHeader(
      "Execution Plan",
      "Action Items",
      "Tasks, owners, and due dates from the structured meeting analysis.",
    );

    const tableWidth = CONTENT_WIDTH;
    const colTask = 268;
    const colOwner = 102;
    const colDue = 92;
    const colStatus = tableWidth - colTask - colOwner - colDue;

    const drawHeader = () => {
      page.drawRectangle({
        x: PAGE_MARGIN,
        y: cursorY - 28,
        width: tableWidth,
        height: 28,
        color: COLORS.accentDark,
      });

      [
        { label: "Task", x: PAGE_MARGIN + 12 },
        { label: "Owner", x: PAGE_MARGIN + colTask + 12 },
        { label: "Due Date", x: PAGE_MARGIN + colTask + colOwner + 12 },
        {
          label: "Status",
          x: PAGE_MARGIN + colTask + colOwner + colDue + 12,
        },
      ].forEach((column) => {
        page.drawText(column.label.toUpperCase(), {
          x: column.x,
          y: cursorY - 18,
          size: 8,
          font: boldFont,
          color: COLORS.white,
        });
      });

      cursorY -= 28;
    };

    ensureSpace(42);
    drawHeader();

    if (meeting.actionItems.length === 0) {
      ensureSpace(36);
      page.drawRectangle({
        x: PAGE_MARGIN,
        y: cursorY - 34,
        width: tableWidth,
        height: 34,
        color: COLORS.white,
        borderColor: COLORS.line,
        borderWidth: 1,
      });

      page.drawText("No action items were identified for this meeting.", {
        x: PAGE_MARGIN + 12,
        y: cursorY - 22,
        size: 10,
        font: regularFont,
        color: COLORS.muted,
      });

      cursorY -= 40;
      return;
    }

    meeting.actionItems.forEach((item, index) => {
      const taskLines = splitTextIntoLines(item.title, regularFont, 9, colTask - 18);
      const rowHeight = Math.max(38, taskLines.length * 12 + 12);

      ensureSpace(rowHeight + 2);

      page.drawRectangle({
        x: PAGE_MARGIN,
        y: cursorY - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: index % 2 === 0 ? COLORS.white : COLORS.background,
        borderColor: COLORS.line,
        borderWidth: 1,
      });

      taskLines.slice(0, 3).forEach((line, lineIndex) => {
        page.drawText(line, {
          x: PAGE_MARGIN + 12,
          y: cursorY - 14 - lineIndex * 12,
          size: 9,
          font: regularFont,
          color: COLORS.body,
        });
      });

      page.drawText(item.owner || "Unassigned", {
        x: PAGE_MARGIN + colTask + 12,
        y: cursorY - 18,
        size: 9,
        font: regularFont,
        color: COLORS.body,
      });

      page.drawText(item.dueDate || "Not specified", {
        x: PAGE_MARGIN + colTask + colOwner + 12,
        y: cursorY - 18,
        size: 9,
        font: regularFont,
        color: COLORS.body,
      });

      page.drawRectangle({
        x: PAGE_MARGIN + colTask + colOwner + colDue + 12,
        y: cursorY - 20,
        width: colStatus - 24,
        height: 14,
        color: COLORS.accentSoft,
      });

      page.drawText("OPEN", {
        x: PAGE_MARGIN + colTask + colOwner + colDue + 22,
        y: cursorY - 15,
        size: 7,
        font: boldFont,
        color: COLORS.accentDark,
      });

      cursorY -= rowHeight + 2;
    });
  };

  drawCoverPage();
  drawFooter();

  page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pageNumber = 2;
  drawPageBackground();
  cursorY = TOP_START;

  drawReportHeader();
  drawMetaCards();
  drawSummaryPanel();
  drawMetricsSection();
  drawInsightRow();
  drawKeyPoints();
  drawActionItemsTable();
  drawFooter();

  return pdfDoc.save();
}

export async function GET(
  _request: Request,
  { params }: MeetingExportRouteProps,
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }

    const meeting = await prisma.meeting.findFirst({
      where: { id, userId: user.id },
    });

    if (!meeting) {
      return Response.json({ error: "Meeting not found." }, { status: 404 });
    }

    const keyPoints = getMeetingKeyPoints(meeting.keyPoints);
    const actionItems = getMeetingActionItems(meeting.actionItems);

    if (!meeting.summary || keyPoints.length === 0) {
      return Response.json(
        { error: "This meeting does not have exportable analysis yet." },
        { status: 400 },
      );
    }

    const pdfBytes = await createPdfReport({
      title: meeting.title,
      sourceType: meeting.sourceType,
      status: meeting.status,
      originalFileName: meeting.originalFileName,
      sourceText:
        meeting.sourceType === "audio_file"
          ? meeting.transcript?.trim() || null
          : meeting.rawText?.trim() || null,
      summary: meeting.summary,
      analyzedAt: meeting.analyzedAt,
      keyPoints,
      actionItems,
    });
    const filename = `${sanitizeFilename(meeting.title) || "meeting"}-report.pdf`;

    return new Response(new Uint8Array(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBytes.length),
      },
    });
  } catch (error) {
    console.error("Failed to export PDF:", error);

    return Response.json(
      {
        error: "Failed to export PDF.",
        details:
          process.env.NODE_ENV !== "production" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 },
    );
  }
}

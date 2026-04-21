-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN "actionItems" JSONB;
ALTER TABLE "Meeting" ADD COLUMN "analysisError" TEXT;
ALTER TABLE "Meeting" ADD COLUMN "analyzedAt" DATETIME;
ALTER TABLE "Meeting" ADD COLUMN "keyPoints" JSONB;
ALTER TABLE "Meeting" ADD COLUMN "summary" TEXT;

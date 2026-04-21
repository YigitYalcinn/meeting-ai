-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN "processedAt" DATETIME;
ALTER TABLE "Meeting" ADD COLUMN "transcript" TEXT;
ALTER TABLE "Meeting" ADD COLUMN "transcriptionError" TEXT;

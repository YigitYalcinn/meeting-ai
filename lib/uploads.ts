import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const uploadsDirectory = path.join(process.cwd(), "uploads", "meetings");

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export async function saveUploadedFile(file: File) {
  const originalName = file.name || "upload";
  const safeName = sanitizeFilename(originalName);
  const extension = path.extname(safeName);
  const storedFilename = `${Date.now()}-${randomUUID()}${extension}`;
  const relativePath = path.join("uploads", "meetings", storedFilename);
  const absolutePath = path.join(process.cwd(), relativePath);
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  await mkdir(uploadsDirectory, { recursive: true });
  await writeFile(absolutePath, fileBuffer);

  return {
    originalFileName: originalName,
    mimeType: file.type || null,
    storedFilePath: relativePath.replaceAll("\\", "/"),
    buffer: fileBuffer,
  };
}

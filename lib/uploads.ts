import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { del, head, put } from "@vercel/blob";

const uploadsDirectory = path.join(process.cwd(), "uploads", "meetings");

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export async function saveUploadedFile(file: File) {
  const originalName = file.name || "upload";
  const safeName = sanitizeFilename(originalName);
  const extension = path.extname(safeName);
  const storedFilename = `${Date.now()}-${randomUUID()}${extension}`;
  const storedPath = `meetings/${storedFilename}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(storedPath, fileBuffer, {
      access: "public",
      contentType: file.type || undefined,
    });

    return {
      originalFileName: originalName,
      mimeType: file.type || null,
      storedFilePath: blob.url,
      buffer: fileBuffer,
    };
  }

  const relativePath = path.join("uploads", "meetings", storedFilename);
  const absolutePath = path.join(uploadsDirectory, storedFilename);

  await mkdir(uploadsDirectory, { recursive: true });
  await writeFile(absolutePath, fileBuffer);

  return {
    originalFileName: originalName,
    mimeType: file.type || null,
    storedFilePath: relativePath.replaceAll("\\", "/"),
    buffer: fileBuffer,
  };
}

export function getStoredFileAbsolutePath(storedFilePath: string) {
  return path.join(uploadsDirectory, path.basename(storedFilePath));
}

export async function getStoredFileBuffer(storedFilePath: string) {
  if (storedFilePath.startsWith("http://") || storedFilePath.startsWith("https://")) {
    const response = await fetch(storedFilePath);

    if (!response.ok) {
      throw new Error("Stored file could not be downloaded.");
    }

    return Buffer.from(await response.arrayBuffer());
  }

  const { readFile } = await import("node:fs/promises");

  return readFile(getStoredFileAbsolutePath(storedFilePath));
}

export async function storedFileExists(storedFilePath: string) {
  if (storedFilePath.startsWith("http://") || storedFilePath.startsWith("https://")) {
    try {
      await head(storedFilePath);
      return true;
    } catch {
      try {
        const response = await fetch(storedFilePath, { method: "HEAD" });
        return response.ok;
      } catch {
        return false;
      }
    }
  }

  try {
    const { access } = await import("node:fs/promises");
    await access(getStoredFileAbsolutePath(storedFilePath));
    return true;
  } catch {
    return false;
  }
}

export async function deleteStoredFile(storedFilePath: string) {
  if (storedFilePath.startsWith("http://") || storedFilePath.startsWith("https://")) {
    await del(storedFilePath);
  }
}

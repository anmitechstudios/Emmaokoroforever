import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type OutputInfo } from "sharp";
import { usingSupabase } from "@/lib/db";
import { DATA_DIR } from "@/lib/db/local";
import { supabase } from "@/lib/db/supabase";

export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const BUCKET = "memorial-media";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_MEDIA_BYTES = 4 * 1024 * 1024;

export const MEDIA_TYPES: Record<string, { ext: string; kind: "audio" | "video" }> = {
  "audio/mpeg": { ext: "mp3", kind: "audio" },
  "audio/mp4": { ext: "m4a", kind: "audio" },
  "audio/x-m4a": { ext: "m4a", kind: "audio" },
  "audio/wav": { ext: "wav", kind: "audio" },
  "audio/x-wav": { ext: "wav", kind: "audio" },
  "audio/ogg": { ext: "ogg", kind: "audio" },
  "video/mp4": { ext: "mp4", kind: "video" },
  "video/webm": { ext: "webm", kind: "video" },
};

export const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
  ogg: "audio/ogg",
  mp4: "video/mp4",
  webm: "video/webm",
};

export class UploadError extends Error {}

async function put(name: string, body: Buffer, contentType: string): Promise<string> {
  if (usingSupabase) {
    const { error } = await supabase().storage.from(BUCKET).upload(name, body, { contentType, cacheControl: "31536000" });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return supabase().storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
  }
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), body);
  return `/media/${name}`;
}

/**
 * Stores a photograph. The file is decoded and re-encoded rather than saved
 * as sent: anything that is not a real image is rejected, embedded metadata
 * (including GPS location) is dropped, and oversized photos are scaled down.
 */
export async function saveImage(file: File, maxEdge = 2400): Promise<{ url: string; width: number; height: number }> {
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError("That photo is too large — please choose one under 10 MB.");
  let output: { data: Buffer; info: OutputInfo };
  try {
    output = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 80_000_000 })
      .rotate()
      .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new UploadError("We couldn't read that file as a photo. Please try a JPG or PNG.");
  }
  const url = await put(`${randomUUID()}.jpg`, output.data, "image/jpeg");
  return { url, width: output.info.width, height: output.info.height };
}

/** Stores an audio or video recording (administrators only). */
export async function saveMedia(file: File): Promise<{ url: string; kind: "audio" | "video" }> {
  const type = MEDIA_TYPES[file.type];
  if (!type) throw new UploadError("Please upload an MP3, M4A, WAV, OGG, MP4 or WebM file.");
  if (file.size > MAX_MEDIA_BYTES) {
    throw new UploadError("That file is over 4 MB. For longer recordings, upload to YouTube or Vimeo and paste the link.");
  }
  const url = await put(`${randomUUID()}.${type.ext}`, Buffer.from(await file.arrayBuffer()), file.type);
  return { url, kind: type.kind };
}

/** Best-effort removal of a file we stored. Sample artwork and external links are left alone. */
export async function removeStored(url: string): Promise<void> {
  try {
    if (url.startsWith("/media/")) {
      await unlink(path.join(UPLOAD_DIR, path.basename(url)));
    } else if (usingSupabase && url.includes(`/object/public/${BUCKET}/`)) {
      await supabase().storage.from(BUCKET).remove([url.split(`/${BUCKET}/`)[1]]);
    }
  } catch {
    // Already gone.
  }
}

/** Bytes of a stored or sample image — for the PDF, social preview and zip download. */
export async function readImage(url: string): Promise<Buffer | null> {
  try {
    if (url.startsWith("/media/")) {
      return await sharp(path.join(UPLOAD_DIR, path.basename(url))).toBuffer();
    }
    if (url.startsWith("/")) {
      const file = path.join(process.cwd(), "public", path.normalize(url).replace(/^(\.\.[/\\])+/, ""));
      return await sharp(file).toBuffer();
    }
    if (usingSupabase && url.startsWith(process.env.SUPABASE_URL!)) {
      const res = await fetch(url);
      return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
    }
  } catch {
    // Fall through.
  }
  return null;
}

/** True when `value` is an upload the visitor actually attached. */
export function hasFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

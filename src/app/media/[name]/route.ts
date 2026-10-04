import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import type { NextRequest } from "next/server";
import { CONTENT_TYPES, UPLOAD_DIR } from "@/lib/storage";

// Serves files uploaded to the local store (development / self-hosting).
// With Supabase configured, uploads are served from Supabase Storage instead.

const NAME = /^[0-9a-f-]{36}\.(jpg|mp3|m4a|wav|ogg|mp4|webm)$/;

export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!NAME.test(name)) return new Response("Not found", { status: 404 });

  const file = path.join(UPLOAD_DIR, name);
  const size = await stat(file).then((s) => s.size, () => null);
  if (size === null) return new Response("Not found", { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": CONTENT_TYPES[name.split(".")[1]],
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
  };

  // Audio and video players seek with range requests.
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    return new Response(Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }

  return new Response(Readable.toWeb(createReadStream(file)) as ReadableStream, {
    headers: { ...headers, "Content-Length": String(size) },
  });
}

import { zipSync } from "fflate";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getMemorial } from "@/lib/queries";
import { allow, visitorHash } from "@/lib/security/guard";
import { readImage } from "@/lib/storage";

// Downloads one photograph as a JPEG, or several as a zip.

const slug = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 60);

export async function GET(request: NextRequest) {
  if (!allow(`photos:${await visitorHash()}`, 20, 10 * 60_000)) return new Response("Too many downloads. Please try again shortly.", { status: 429 });

  const ids = (request.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .filter((id) => /^[0-9a-f-]{36}$/.test(id))
    .slice(0, 40);
  if (!ids.length) return new Response("No photographs selected.", { status: 400 });

  const [memorial, store] = await Promise.all([getMemorial(), db()]);
  const rows = (await Promise.all(ids.map((id) => store.get("gallery_images", id)))).filter(
    (row) => row !== null && row.memorial_id === memorial.id,
  );

  const files: Record<string, Uint8Array> = {};
  for (const [i, row] of rows.entries()) {
    const bytes = await readImage(row!.url);
    if (bytes) files[`${String(i + 1).padStart(2, "0")}-${slug(row!.caption) || "photograph"}.jpg`] = new Uint8Array(bytes);
  }
  const names = Object.keys(files);
  if (!names.length) return new Response("Those photographs could not be found.", { status: 404 });

  const base = slug(memorial.full_name);
  if (names.length === 1) {
    return new Response(files[names[0]] as BodyInit, {
      headers: { "Content-Type": "image/jpeg", "Content-Disposition": `attachment; filename="${base}-${names[0].slice(3)}"` },
    });
  }
  // JPEGs are already compressed; store them as-is.
  return new Response(zipSync(files, { level: 0 }) as BodyInit, {
    headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${base}-photographs.zip"` },
  });
}

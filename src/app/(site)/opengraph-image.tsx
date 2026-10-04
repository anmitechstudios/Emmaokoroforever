import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { longDate } from "@/lib/format";
import { getMemorial } from "@/lib/queries";
import { readImage } from "@/lib/storage";

// The preview card shown when the memorial's link is shared on WhatsApp,
// Facebook, X or iMessage: portrait, name, "In Loving Memory", dates.

export const alt = "In loving memory";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 300;

const font = (file: string) => readFile(path.join(process.cwd(), "src/assets/fonts", file));

export default async function OpenGraphImage() {
  const memorial = await getMemorial();
  const [light, italic, original] = await Promise.all([
    font("cormorant-garamond-latin-300-normal.woff"),
    font("cormorant-garamond-latin-400-italic.woff"),
    readImage(memorial.hero_image_url),
  ]);
  const portrait = original
    ? `data:image/jpeg;base64,${(await sharp(original).resize(760, 1000, { fit: "cover" }).jpeg({ quality: 84 }).toBuffer()).toString("base64")}`
    : null;

  const words = memorial.full_name.trim().split(/\s+/);
  const given = words.slice(0, -1).join(" ");
  const family = words[words.length - 1];
  const accent = memorial.settings.accent;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f6f2ea", color: "#24211d", fontFamily: "Cormorant" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 20px 0 80px" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 21, letterSpacing: 7, textTransform: "uppercase", color: "#6e675d" }}>
            <div style={{ width: 56, height: 1, background: accent, marginRight: 22 }} />
            {memorial.epitaph}
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 34, fontSize: given.length > 16 ? 76 : 92, lineHeight: 0.98, letterSpacing: -1.5 }}>
            {given && <div style={{ display: "flex" }}>{given}</div>}
            <div style={{ display: "flex", fontFamily: "Cormorant Italic", color: accent }}>{family}</div>
          </div>
          <div style={{ display: "flex", marginTop: 40, fontSize: 25, letterSpacing: 3, textTransform: "uppercase", color: "#4a453e" }}>
            {longDate(memorial.born_on)} — {longDate(memorial.died_on)}
          </div>
        </div>
        {portrait && (
          <div style={{ display: "flex", alignItems: "center", paddingRight: 80 }}>
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
            <img src={portrait} width={380} height={500} style={{ borderRadius: "190px 190px 3px 3px", objectFit: "cover" }} />
          </div>
        )}
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Cormorant", data: light, weight: 300, style: "normal" },
        { name: "Cormorant Italic", data: italic, weight: 400, style: "normal" },
      ],
    },
  );
}

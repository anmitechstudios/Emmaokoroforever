// Dates are stored as plain ISO days and shown in a fixed, timezone-proof way.

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parts(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { y, m, d };
}

/** 12 March 1958 */
export function longDate(iso: string): string {
  if (!iso) return "";
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Saturday, 17 October 2026 */
export function fullDate(iso: string): string {
  if (!iso) return "";
  const { y, m, d } = parts(iso);
  return `${DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}, ${longDate(iso)}`;
}

export function year(iso: string): string {
  return iso.slice(0, 4);
}

export function lifespan(born: string, died: string): string {
  return `${year(born)} — ${year(died)}`;
}

export function age(born: string, died: string): number {
  const b = parts(born);
  const d = parts(died);
  return d.y - b.y - (d.m < b.m || (d.m === b.m && d.d < b.d) ? 1 : 0);
}

export function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}

/** Splits a full name so the family name can sit on its own line. */
export function splitName(full: string): { given: string; family: string } {
  const words = full.trim().split(/\s+/);
  if (words.length < 2) return { given: "", family: full };
  return { given: words.slice(0, -1).join(" "), family: words[words.length - 1] };
}

export function paragraphs(text: string): string[] {
  return text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

export function siteUrl(): string {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return (process.env.SITE_URL || (vercel ? `https://${vercel}` : "http://localhost:3000")).replace(/\/$/, "");
}

/** Turns a YouTube or Vimeo link into its privacy-friendly embed address. */
export function embedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}?autoplay=1&rel=0`;
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:embed|live|shorts)\/([\w-]+)/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : null;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.match(/\/(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1` : null;
    }
  } catch {
    // Not a URL.
  }
  return null;
}

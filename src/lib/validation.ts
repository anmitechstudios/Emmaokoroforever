import { z } from "zod";

/** Normalises user text: no control characters, no runs of blank lines, trimmed. */
export function tidy(value: unknown): string {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const line = (max: number) => z.preprocess((v) => tidy(v).replace(/\s+/g, " "), z.string().max(max, `Please keep this under ${max} characters.`));
const text = (max: number) => z.preprocess(tidy, z.string().max(max, `Please keep this under ${max} characters.`));
const required = (schema: z.ZodType<string>, message: string) => schema.refine((v) => v.length > 0, message);
const optionalEmail = z.preprocess(
  (v) => tidy(v).toLowerCase(),
  z.union([z.literal(""), z.email("That email address doesn't look right.").max(200)]),
);

export const tributeSchema = z.object({
  name: required(line(80), "Please tell us your name."),
  email: optionalEmail,
  relationship: line(80),
  message: required(text(2000), "Please write a few words.").refine((v) => v.length === 0 || v.length >= 10, "A little more, if you can."),
});

export const memorySchema = z.object({
  name: required(line(80), "Please tell us your name."),
  relationship: line(80),
  body: required(text(600), "Please share your memory.").refine((v) => v.length === 0 || v.length >= 10, "A little more, if you can."),
});

export const guestbookSchema = z.object({
  name: required(line(80), "Please sign your name."),
  location: line(60),
  message: required(line(200), "Please leave a short message."),
});

export const candleNameSchema = z.object({ name: required(line(40), "Please enter a name.") });

export const reportSchema = z.object({
  reason: z.enum(["inappropriate", "spam", "inaccurate", "other"]),
});

// ── Admin ────────────────────────────────────────────────────────────────

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a date.");
// Only web links — never javascript: or data: addresses.
const url = z.preprocess(
  tidy,
  z.union([z.literal(""), z.url({ protocol: /^https?$/, error: "Please enter a full link, starting with https://" }).max(500)]),
);
const order = z.coerce.number().int().min(0).max(100000).catch(0);

export const memorialSchema = z.object({
  honorific: line(40),
  full_name: required(line(120), "A name is required."),
  short_name: required(line(40), "A short name is required."),
  born_on: isoDate,
  died_on: isoDate,
  birthplace: line(120),
  epitaph: required(line(60), "Required."),
  quote: text(400),
  quote_source: line(120),
  hero_image_alt: line(200),
  story_intro: text(800),
  closing_message: text(800),
});

export const chapterSchema = z.object({
  id: z.string().max(64),
  kicker: line(120),
  title: line(160),
  body: text(6000),
  pull_quote: text(300),
  image_url: z.string().max(500),
  image_caption: line(200),
});

export const favoriteSchema = z.object({
  id: z.string().max(64),
  label: line(60),
  value: text(300),
  note: text(300),
});

export const scheduleSchema = z.object({
  id: z.string().max(64),
  time: line(40),
  title: line(120),
  note: line(200),
});

export const timelineSchema = z.object({
  year: required(line(20), "Required."),
  title: required(line(160), "Required."),
  description: text(600),
  sort_order: order,
});

export const familySchema = z.object({
  name: required(line(120), "Required."),
  family_group: z.enum(["spouse", "children", "grandchildren", "siblings", "parents", "predeceased"]),
  note: line(200),
  sort_order: order,
});

export const gallerySchema = z.object({
  caption: line(200),
  taken: line(40),
  category: line(40),
  sort_order: order,
});

export const mediaSchema = z.object({
  kind: z.enum(["audio", "video"]),
  title: required(line(160), "Required."),
  description: text(600),
  category: line(40),
  link: url,
  recorded: line(60),
  sort_order: order,
});

export const serviceSchema = z.object({
  title: line(120),
  date: z.union([z.literal(""), isoDate]),
  time: line(60),
  venue: line(160),
  address: line(300),
  map_query: line(300),
  livestream_url: url,
  dress_code: line(300),
  notes: text(800),
});

export const settingsSchema = z.object({
  theme: z.enum(["ivory", "stone", "evening"]),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a colour."),
  share_title: line(120),
  share_description: text(300),
  contact_name: line(120),
  contact_email: optionalEmail,
  contact_phone: line(40),
});

export const moderationEditSchema = z.object({
  name: line(80),
  relationship: line(80).optional(),
  location: line(60).optional(),
  text: text(2000),
});

export const emailChangeSchema = z.object({
  current: z.string().min(1, "Enter your current password."),
  email: z.preprocess((v) => tidy(v).toLowerCase(), z.email("That email address doesn't look right.").max(200)),
});

export const passwordSchema = z.object({
  current: z.string().min(1, "Enter your current password."),
  next: z.string().min(10, "Use at least 10 characters.").max(200),
});

export type FieldErrors = Record<string, string>;

/** Flattens a Zod error to one message per field — the shape our forms display. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

/** Reads plain string fields from a form into an object, for handing to a schema. */
export function fields(form: FormData, keys: string[]): Record<string, string> {
  return Object.fromEntries(keys.map((k) => [k, String(form.get(k) ?? "")]));
}

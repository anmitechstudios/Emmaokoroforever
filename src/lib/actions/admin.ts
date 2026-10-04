"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { SECTION_KEYS, STATUSES, type SectionKey, type Status } from "@/lib/db/types";
import { getMemorial } from "@/lib/queries";
import { allow, visitorHash } from "@/lib/security/guard";
import { hasFile, removeStored, saveImage, saveMedia, UploadError } from "@/lib/storage";
import {
  chapterSchema,
  familySchema,
  favoriteSchema,
  fieldErrors,
  fields,
  gallerySchema,
  mediaSchema,
  memorialSchema,
  moderationEditSchema,
  emailChangeSchema,
  passwordSchema,
  scheduleSchema,
  serviceSchema,
  settingsSchema,
  timelineSchema,
  type FieldErrors,
} from "@/lib/validation";

// Everything the family can do from the dashboard. Every action begins by
// confirming the caller is a signed-in administrator, and only ever touches
// rows that belong to the current memorial.

export type AdminState = { ok: boolean; message?: string; errors?: FieldErrors } | null;

const SAVED: AdminState = { ok: true, message: "Saved." };
const invalid = (error: z.ZodError): AdminState => ({ ok: false, message: "Please check the highlighted fields.", errors: fieldErrors(error) });
const failed = (message: string): AdminState => ({ ok: false, message });

async function context() {
  await requireAdmin();
  const [memorial, store] = await Promise.all([getMemorial(), db()]);
  return { memorial, store };
}

/** Publishes a change: the public pages and the dashboard are both rebuilt. */
function publish() {
  revalidatePath("/", "layout");
}

/** Runs an upload, turning "that isn't a photo" into a message rather than a crash. */
async function upload<T>(work: () => Promise<T>): Promise<{ value: T } | { error: string }> {
  try {
    return { value: await work() };
  } catch (error) {
    if (error instanceof UploadError) return { error: error.message };
    throw error;
  }
}

function parseList<T>(form: FormData, name: string, schema: z.ZodType<T>): T[] | null {
  try {
    const parsed = z.array(schema).max(60).safeParse(JSON.parse(String(form.get(name) ?? "[]")));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// ── Signing in ───────────────────────────────────────────────────────────

export async function signIn(_: AdminState, form: FormData): Promise<AdminState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!allow(`signin:${await visitorHash()}`, 6, 10 * 60_000) || !allow(`signin:${email}`, 10, 30 * 60_000)) {
    return failed("Too many attempts. Please wait ten minutes and try again.");
  }
  const store = await db();
  const [user] = email ? await store.list("admin_users", { where: { email }, limit: 1 }) : [];
  // Always spend the time to check a hash, so a wrong email and a wrong password look the same.
  const valid = await verifyPassword(password, user?.password_hash ?? "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==");
  if (!user || !valid) return failed("That email and password don't match.");
  await createSession(user.id);
  redirect("/admin");
}

export async function signOut() {
  await destroySession();
  redirect("/admin/login");
}

export async function changePassword(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await requireAdmin();
  const parsed = passwordSchema.safeParse(fields(form, ["current", "next"]));
  if (!parsed.success) return invalid(parsed.error);
  if (!(await verifyPassword(parsed.data.current, admin.password_hash))) {
    return { ok: false, errors: { current: "That isn't your current password." } };
  }
  await (await db()).update("admin_users", admin.id, { password_hash: await hashPassword(parsed.data.next) });
  return { ok: true, message: "Password changed." };
}

export async function changeEmail(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await requireAdmin();
  const parsed = emailChangeSchema.safeParse(fields(form, ["current", "email"]));
  if (!parsed.success) return invalid(parsed.error);
  if (!(await verifyPassword(parsed.data.current, admin.password_hash))) {
    return { ok: false, errors: { current: "That isn't your current password." } };
  }
  const store = await db();
  const [taken] = await store.list("admin_users", { where: { email: parsed.data.email }, limit: 1 });
  if (taken && taken.id !== admin.id) return { ok: false, errors: { email: "Another administrator already uses that email." } };
  await store.update("admin_users", admin.id, { email: parsed.data.email });
  revalidatePath("/admin", "layout");
  return { ok: true, message: `You'll now sign in as ${parsed.data.email}.` };
}

// ── Memorial ─────────────────────────────────────────────────────────────

export async function saveMemorial(_: AdminState, form: FormData): Promise<AdminState> {
  const { memorial, store } = await context();
  const parsed = memorialSchema.safeParse(fields(form, Object.keys(memorialSchema.shape)));
  if (!parsed.success) return invalid(parsed.error);
  if (parsed.data.died_on < parsed.data.born_on) return { ok: false, errors: { died_on: "This is before the date of birth." } };

  let hero_image_url = memorial.hero_image_url;
  const portrait = form.get("hero_image");
  if (hasFile(portrait)) {
    const result = await upload(() => saveImage(portrait));
    if ("error" in result) return { ok: false, errors: { hero_image: result.error } };
    await removeStored(hero_image_url);
    hero_image_url = result.value.url;
  }

  await store.update("memorials", memorial.id, { ...parsed.data, hero_image_url, updated_at: new Date().toISOString() });
  publish();
  return SAVED;
}

export async function saveChapters(_: AdminState, form: FormData): Promise<AdminState> {
  const { memorial, store } = await context();
  const chapters = parseList(form, "chapters", chapterSchema);
  if (!chapters) return failed("Something in the story couldn't be saved. Please check the length of each chapter.");

  const known = new Set(memorial.chapters.map((c) => c.image_url));
  for (const chapter of chapters) {
    // An image address is only trusted if it is one we already stored.
    if (chapter.image_url && !known.has(chapter.image_url)) chapter.image_url = "";
    const file = form.get(`chapters__${chapter.id}__image_url`);
    if (hasFile(file)) {
      const result = await upload(() => saveImage(file));
      if ("error" in result) return failed(`${chapter.title || "A chapter"}: ${result.error}`);
      chapter.image_url = result.value.url;
    }
  }
  const kept = new Set(chapters.map((c) => c.image_url));
  await Promise.all(memorial.chapters.filter((c) => c.image_url && !kept.has(c.image_url)).map((c) => removeStored(c.image_url)));

  await store.update("memorials", memorial.id, { chapters, updated_at: new Date().toISOString() });
  publish();
  return SAVED;
}

export async function saveFavorites(_: AdminState, form: FormData): Promise<AdminState> {
  const { memorial, store } = await context();
  const favorites = parseList(form, "favorites", favoriteSchema);
  if (!favorites) return failed("Something couldn't be saved. Please check the length of each entry.");
  await store.update("memorials", memorial.id, { favorites: favorites.filter((f) => f.label || f.value) });
  publish();
  return SAVED;
}

export async function saveSettings(_: AdminState, form: FormData): Promise<AdminState> {
  const { memorial, store } = await context();
  const choice = String(form.get("accent_choice") ?? "custom");
  const parsed = settingsSchema.safeParse({
    ...fields(form, Object.keys(settingsSchema.shape)),
    accent: (choice === "custom" ? String(form.get("accent_custom") ?? "") : choice).toLowerCase(),
  });
  if (!parsed.success) return invalid(parsed.error);
  const sections = Object.fromEntries(SECTION_KEYS.map((key) => [key, form.get(`section_${key}`) === "on"])) as Record<SectionKey, boolean>;
  await store.update("memorials", memorial.id, { settings: { ...parsed.data, sections } });
  publish();
  return SAVED;
}

// ── Service ──────────────────────────────────────────────────────────────

export async function saveService(_: AdminState, form: FormData): Promise<AdminState> {
  const { memorial, store } = await context();
  const parsed = serviceSchema.safeParse(fields(form, Object.keys(serviceSchema.shape)));
  if (!parsed.success) return invalid(parsed.error);
  const schedule = parseList(form, "schedule", scheduleSchema);
  if (!schedule) return failed("The schedule couldn't be saved. Please check each line.");

  const data = { ...parsed.data, schedule: schedule.filter((s) => s.time || s.title) };
  const [existing] = await store.list("service_info", { where: { memorial_id: memorial.id }, limit: 1 });
  if (existing) await store.update("service_info", existing.id, data);
  else await store.insert("service_info", { id: randomUUID(), memorial_id: memorial.id, ...data });
  publish();
  return SAVED;
}

// ── Timeline & family ────────────────────────────────────────────────────

export async function saveTimelineEvent(_: AdminState, form: FormData): Promise<AdminState> {
  const { memorial, store } = await context();
  const parsed = timelineSchema.safeParse(fields(form, Object.keys(timelineSchema.shape)));
  if (!parsed.success) return invalid(parsed.error);
  const id = String(form.get("id") ?? "");
  if (id) {
    const row = await store.get("timeline_events", id);
    if (row?.memorial_id !== memorial.id) return failed("That event no longer exists.");
    await store.update("timeline_events", id, parsed.data);
  } else {
    await store.insert("timeline_events", { id: randomUUID(), memorial_id: memorial.id, ...parsed.data });
  }
  publish();
  return id ? SAVED : { ok: true, message: "Added." };
}

export async function saveFamilyMember(_: AdminState, form: FormData): Promise<AdminState> {
  const { memorial, store } = await context();
  const parsed = familySchema.safeParse(fields(form, Object.keys(familySchema.shape)));
  if (!parsed.success) return invalid(parsed.error);
  const id = String(form.get("id") ?? "");
  if (id) {
    const row = await store.get("family_members", id);
    if (row?.memorial_id !== memorial.id) return failed("That person is no longer listed.");
    await store.update("family_members", id, parsed.data);
  } else {
    await store.insert("family_members", { id: randomUUID(), memorial_id: memorial.id, ...parsed.data });
  }
  publish();
  return id ? SAVED : { ok: true, message: "Added." };
}

// ── Gallery ──────────────────────────────────────────────────────────────

/** Adds one photograph. The uploader sends files one at a time so each stays small. */
export async function uploadGalleryImage(form: FormData): Promise<AdminState> {
  const { memorial, store } = await context();
  const file = form.get("file");
  if (!hasFile(file)) return failed("No photograph was received.");
  const result = await upload(() => saveImage(file));
  if ("error" in result) return failed(result.error);

  const order = await store.count("gallery_images", { where: { memorial_id: memorial.id } });
  await store.insert("gallery_images", {
    id: randomUUID(),
    memorial_id: memorial.id,
    ...result.value,
    caption: "",
    taken: "",
    category: String(form.get("category") ?? "").slice(0, 40),
    sort_order: order,
    created_at: new Date().toISOString(),
  });
  publish();
  return { ok: true };
}

export async function saveGalleryImage(_: AdminState, form: FormData): Promise<AdminState> {
  const { memorial, store } = await context();
  const parsed = gallerySchema.safeParse(fields(form, Object.keys(gallerySchema.shape)));
  if (!parsed.success) return invalid(parsed.error);
  const id = String(form.get("id") ?? "");
  const row = await store.get("gallery_images", id);
  if (row?.memorial_id !== memorial.id) return failed("That photograph no longer exists.");
  await store.update("gallery_images", id, parsed.data);
  publish();
  return SAVED;
}

// ── Recordings ───────────────────────────────────────────────────────────

export async function saveMediaItem(_: AdminState, form: FormData): Promise<AdminState> {
  const { memorial, store } = await context();
  const parsed = mediaSchema.safeParse(fields(form, Object.keys(mediaSchema.shape)));
  if (!parsed.success) return invalid(parsed.error);
  const { link, ...data } = parsed.data;

  const id = String(form.get("id") ?? "");
  const existing = id ? await store.get("media", id) : null;
  if (id && existing?.memorial_id !== memorial.id) return failed("That recording no longer exists.");

  let url = existing?.url ?? "";
  let kind = data.kind;
  const file = form.get("file");
  if (hasFile(file)) {
    const result = await upload(() => saveMedia(file));
    if ("error" in result) return { ok: false, errors: { file: result.error } };
    if (url) await removeStored(url);
    url = result.value.url;
    kind = result.value.kind;
  } else if (link) {
    if (url && url !== link) await removeStored(url);
    url = link;
  } else if (form.get("clear_file") === "on") {
    await removeStored(url);
    url = "";
  }

  let poster_url = existing?.poster_url ?? "";
  const poster = form.get("poster");
  if (hasFile(poster)) {
    const result = await upload(() => saveImage(poster, 1600));
    if ("error" in result) return { ok: false, errors: { poster: result.error } };
    await removeStored(poster_url);
    poster_url = result.value.url;
  }

  const row = { ...data, kind, url, poster_url };
  if (existing) await store.update("media", existing.id, row);
  else await store.insert("media", { id: randomUUID(), memorial_id: memorial.id, ...row, created_at: new Date().toISOString() });
  publish();
  return existing ? SAVED : { ok: true, message: "Added." };
}

// ── Deleting ─────────────────────────────────────────────────────────────

const DELETABLE = ["timeline_events", "family_members", "gallery_images", "media", "tributes", "memories", "guestbook_entries", "candles"] as const;
type Deletable = (typeof DELETABLE)[number];

export async function deleteRow(table: Deletable, id: string): Promise<AdminState> {
  const { memorial, store } = await context();
  if (!DELETABLE.includes(table) || typeof id !== "string") return failed("Nothing to delete.");
  const row = await store.get(table, id);
  if (!row || row.memorial_id !== memorial.id) return failed("That item no longer exists.");

  if ("url" in row && row.url) await removeStored(row.url);
  if ("poster_url" in row && row.poster_url) await removeStored(row.poster_url);
  if ("photo_url" in row && row.photo_url) await removeStored(row.photo_url);
  if (table === "tributes") {
    const reports = await store.list("reports", { where: { tribute_id: id } });
    await Promise.all(reports.map((report) => store.remove("reports", report.id)));
  }
  await store.remove(table, id);
  publish();
  return { ok: true, message: "Deleted." };
}

// ── Moderation ───────────────────────────────────────────────────────────

const MODERATED = ["tributes", "memories", "guestbook_entries", "candles"] as const;
export type Moderated = (typeof MODERATED)[number];

export async function moderate(table: Moderated, id: string, status: Status): Promise<AdminState> {
  const { memorial, store } = await context();
  if (!MODERATED.includes(table) || !STATUSES.includes(status) || typeof id !== "string") return failed("That isn't possible.");
  const row = await store.get(table, id);
  if (!row || row.memorial_id !== memorial.id) return failed("That item no longer exists.");

  if (table === "tributes") {
    // Approving a reported tribute settles the reports against it.
    await store.update("tributes", id, status === "approved" ? { status, report_count: 0 } : { status });
    if (status === "approved") {
      const reports = await store.list("reports", { where: { tribute_id: id } });
      await Promise.all(reports.map((report) => store.remove("reports", report.id)));
    }
  } else {
    await store.update(table, id, { status });
  }
  publish();
  return { ok: true };
}

export async function editEntry(table: Moderated, _: AdminState, form: FormData): Promise<AdminState> {
  const { memorial, store } = await context();
  if (!MODERATED.includes(table)) return failed("That isn't possible.");
  const parsed = moderationEditSchema.safeParse({
    name: form.get("name") ?? "",
    relationship: form.get("relationship") ?? undefined,
    location: form.get("location") ?? undefined,
    text: form.get("text") ?? "",
  });
  if (!parsed.success) return invalid(parsed.error);
  const id = String(form.get("id") ?? "");
  const row = await store.get(table, id);
  if (!row || row.memorial_id !== memorial.id) return failed("That item no longer exists.");
  const { name, relationship = "", location = "", text } = parsed.data;

  if (table === "tributes") await store.update("tributes", id, { name, relationship, message: text });
  else if (table === "memories") await store.update("memories", id, { name, relationship, body: text });
  else if (table === "guestbook_entries") await store.update("guestbook_entries", id, { name, location, message: text.slice(0, 200) });
  else await store.update("candles", id, { name: name.slice(0, 40) });
  publish();
  return SAVED;
}

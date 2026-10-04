"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { PublicTribute } from "@/lib/db/types";
import { getMemorial } from "@/lib/queries";
import { allow, countLinks, looksAutomated, underSubmissionLimit, visitorHash } from "@/lib/security/guard";
import { hasFile, saveImage, UploadError } from "@/lib/storage";
import {
  candleNameSchema,
  fieldErrors,
  fields,
  guestbookSchema,
  memorySchema,
  reportSchema,
  tributeSchema,
  type FieldErrors,
} from "@/lib/validation";

// Everything a visitor can do. Each action validates its input, checks for
// automation, rate-limits by a hashed address, and stores the submission as
// "pending" — nothing a visitor writes is public until the family approves it.

export type SubmitState<T = undefined> =
  | { ok: true; entry: T }
  | { ok: false; errors?: FieldErrors; message?: string }
  | null;

const SLOW_DOWN = "You've shared several messages in a short time. Please try again a little later.";
const QUIET_OK = { ok: true } as const; // What a suspected bot is told: success, with nothing stored.

export async function submitTribute(_: SubmitState<PublicTribute>, form: FormData): Promise<SubmitState<PublicTribute>> {
  const parsed = tributeSchema.safeParse(fields(form, ["name", "email", "relationship", "message"]));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const input = parsed.data;
  const draft: PublicTribute = {
    id: randomUUID(),
    name: input.name,
    relationship: input.relationship,
    message: input.message,
    photo_url: "",
    likes: 0,
    created_at: new Date().toISOString(),
  };
  if (looksAutomated(form)) return { ...QUIET_OK, entry: draft };
  if (countLinks(input.message) > 2) {
    return { ok: false, errors: { message: "Please remove some of the links from your message." } };
  }

  const ipHash = await visitorHash();
  if (!(await underSubmissionLimit("tributes", ipHash, 4, 60))) return { ok: false, message: SLOW_DOWN };

  const photo = form.get("photo");
  if (hasFile(photo)) {
    try {
      draft.photo_url = (await saveImage(photo, 1800)).url;
    } catch (error) {
      if (error instanceof UploadError) return { ok: false, errors: { photo: error.message } };
      throw error;
    }
  }

  const memorial = await getMemorial();
  await (await db()).insert("tributes", {
    ...draft,
    memorial_id: memorial.id,
    email: input.email,
    status: "pending",
    report_count: 0,
    ip_hash: ipHash,
  });
  revalidatePath("/admin", "layout");
  return { ok: true, entry: draft };
}

export async function submitMemory(_: SubmitState, form: FormData): Promise<SubmitState> {
  const parsed = memorySchema.safeParse(fields(form, ["name", "relationship", "body"]));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  if (looksAutomated(form)) return { ...QUIET_OK, entry: undefined };
  if (countLinks(parsed.data.body) > 1) return { ok: false, errors: { body: "Please remove the links from your memory." } };

  const ipHash = await visitorHash();
  if (!(await underSubmissionLimit("memories", ipHash, 5, 60))) return { ok: false, message: SLOW_DOWN };

  const memorial = await getMemorial();
  await (await db()).insert("memories", {
    id: randomUUID(),
    memorial_id: memorial.id,
    ...parsed.data,
    status: "pending",
    ip_hash: ipHash,
    created_at: new Date().toISOString(),
  });
  revalidatePath("/admin", "layout");
  return { ok: true, entry: undefined };
}

export async function signGuestbook(_: SubmitState, form: FormData): Promise<SubmitState> {
  const parsed = guestbookSchema.safeParse(fields(form, ["name", "location", "message"]));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  if (looksAutomated(form)) return { ...QUIET_OK, entry: undefined };
  if (countLinks(parsed.data.message) > 0) return { ok: false, errors: { message: "Links aren't allowed in the guestbook." } };

  const ipHash = await visitorHash();
  if (!(await underSubmissionLimit("guestbook_entries", ipHash, 3, 60))) return { ok: false, message: SLOW_DOWN };

  const memorial = await getMemorial();
  await (await db()).insert("guestbook_entries", {
    id: randomUUID(),
    memorial_id: memorial.id,
    ...parsed.data,
    status: "pending",
    ip_hash: ipHash,
    created_at: new Date().toISOString(),
  });
  revalidatePath("/admin", "layout");
  return { ok: true, entry: undefined };
}

/** Lights an anonymous candle. Returns its id so the visitor may add a name to it. */
export async function lightCandle(): Promise<{ ok: boolean; id?: string; message?: string }> {
  const ipHash = await visitorHash();
  if (!(await underSubmissionLimit("candles", ipHash, 3, 24 * 60))) {
    return { ok: false, message: "Your candle is already burning. Thank you." };
  }
  const memorial = await getMemorial();
  const id = randomUUID();
  await (await db()).insert("candles", {
    id,
    memorial_id: memorial.id,
    name: "",
    status: "approved",
    ip_hash: ipHash,
    created_at: new Date().toISOString(),
  });
  revalidatePath("/");
  return { ok: true, id };
}

/** Adds a name to a candle the visitor has just lit. Names are reviewed before they appear. */
export async function nameCandle(id: string, form: FormData): Promise<{ ok: boolean; message?: string }> {
  const parsed = candleNameSchema.safeParse(fields(form, ["name"]));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  if (countLinks(parsed.data.name) > 0) return { ok: false, message: "Please enter just a name." };
  const store = await db();
  const candle = typeof id === "string" ? await store.get("candles", id) : null;
  const fresh = candle && Date.now() - Date.parse(candle.created_at) < 30 * 60_000;
  if (!candle || !fresh || candle.name || candle.ip_hash !== (await visitorHash())) {
    return { ok: false, message: "We couldn't add a name to that candle." };
  }
  await store.update("candles", id, { name: parsed.data.name, status: "pending" });
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** Adds or removes a heart. The visitor's own browser remembers which tributes they've hearted. */
export async function likeTribute(id: string, on: boolean): Promise<{ likes: number } | null> {
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const ipHash = await visitorHash();
  if (!allow(`like:${ipHash}`, 40, 10 * 60_000) || !allow(`like:${ipHash}:${id}`, 4, 60 * 60_000)) return null;
  const store = await db();
  const tribute = await store.get("tributes", id);
  if (!tribute || tribute.status !== "approved") return null;
  const likes = await store.adjustLikes(id, on ? 1 : -1);
  revalidatePath("/");
  return { likes };
}

/** Flags a tribute for the family. Three separate reports hide it until it has been reviewed. */
export async function reportTribute(id: string, reason: string): Promise<{ ok: boolean }> {
  const parsed = reportSchema.safeParse({ reason });
  if (!parsed.success || typeof id !== "string" || !/^[0-9a-f-]{36}$/.test(id)) return { ok: false };
  const ipHash = await visitorHash();
  if (!allow(`report:${ipHash}`, 5, 60 * 60_000)) return { ok: true };

  const store = await db();
  const tribute = await store.get("tributes", id);
  if (!tribute || tribute.status !== "approved") return { ok: true };
  const already = await store.count("reports", { where: { tribute_id: id, ip_hash: ipHash } });
  if (already > 0) return { ok: true };

  await store.insert("reports", {
    id: randomUUID(),
    memorial_id: tribute.memorial_id,
    tribute_id: id,
    reason: parsed.data.reason,
    ip_hash: ipHash,
    created_at: new Date().toISOString(),
  });
  const report_count = tribute.report_count + 1;
  await store.update("tributes", id, report_count >= 3 ? { report_count, status: "pending" } : { report_count });
  if (report_count >= 3) revalidatePath("/");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** Of the tributes this browser submitted, which are still waiting for review? */
export async function checkMyTributes(ids: string[]): Promise<string[]> {
  if (!Array.isArray(ids)) return [];
  const store = await db();
  const valid = ids.filter((id) => typeof id === "string" && /^[0-9a-f-]{36}$/.test(id)).slice(0, 5);
  const rows = await Promise.all(valid.map((id) => store.get("tributes", id)));
  return rows.filter((row) => row?.status === "pending").map((row) => row!.id);
}

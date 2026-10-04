import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import type {
  GuestbookEntry,
  Memorial,
  Memory,
  PublicGuestbookEntry,
  PublicMemory,
  PublicTribute,
  Tribute,
} from "@/lib/db/types";

// Everything the public pages read. Private columns (emails, address hashes)
// are stripped here, so they cannot reach a visitor's browser by accident.

export const TRIBUTE_PAGE = 9;

export const getMemorial = cache(async (): Promise<Memorial> => {
  const store = await db();
  const slug = process.env.MEMORIAL_SLUG;
  const [memorial] = await store.list("memorials", slug ? { where: { slug }, limit: 1 } : { order: [{ column: "created_at" }], limit: 1 });
  if (!memorial) throw new Error(slug ? `No memorial found with slug "${slug}".` : "No memorial found.");
  return memorial;
});

export const publicTribute = (t: Tribute): PublicTribute => ({
  id: t.id,
  name: t.name,
  relationship: t.relationship,
  message: t.message,
  photo_url: t.photo_url,
  likes: t.likes,
  created_at: t.created_at,
});

const publicMemory = (m: Memory): PublicMemory => ({
  id: m.id,
  name: m.name,
  relationship: m.relationship,
  body: m.body,
  created_at: m.created_at,
});

const publicEntry = (g: GuestbookEntry): PublicGuestbookEntry => ({
  id: g.id,
  name: g.name,
  location: g.location,
  message: g.message,
  created_at: g.created_at,
});

export type TributeSort = "newest" | "loved";

export async function listTributes(opts: { search?: string; sort?: TributeSort; offset?: number; limit?: number } = {}) {
  const memorial = await getMemorial();
  const store = await db();
  const query = {
    where: { memorial_id: memorial.id, status: "approved" },
    search: opts.search ? { columns: ["name", "relationship", "message"], term: opts.search } : undefined,
  };
  const limit = Math.min(opts.limit ?? TRIBUTE_PAGE, 30);
  const [rows, total] = await Promise.all([
    store.list("tributes", {
      ...query,
      order:
        opts.sort === "loved"
          ? [{ column: "likes", ascending: false }, { column: "created_at", ascending: false }]
          : [{ column: "created_at", ascending: false }],
      offset: opts.offset ?? 0,
      limit,
    }),
    store.count("tributes", query),
  ]);
  return { tributes: rows.map(publicTribute), total };
}

export async function getTribute(id: string): Promise<PublicTribute | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const memorial = await getMemorial();
  const tribute = await (await db()).get("tributes", id);
  if (!tribute || tribute.status !== "approved" || tribute.memorial_id !== memorial.id) return null;
  return publicTribute(tribute);
}

export async function getHome() {
  const memorial = await getMemorial();
  const store = await db();
  const mine = { memorial_id: memorial.id };
  const approved = { ...mine, status: "approved" };
  const bySort = [{ column: "sort_order" }];
  const newest = [{ column: "created_at", ascending: false }];

  const [timeline, gallery, tributes, memories, guestbook, candleCount, candleNames, family, service, media] =
    await Promise.all([
      store.list("timeline_events", { where: mine, order: bySort }),
      store.list("gallery_images", { where: mine, order: bySort }),
      listTributes(),
      store.list("memories", { where: approved, order: newest, limit: 60 }),
      store.list("guestbook_entries", { where: approved, order: newest, limit: 60 }),
      store.count("candles", { where: mine }),
      store.list("candles", { where: approved, order: newest, limit: 200 }),
      store.list("family_members", { where: mine, order: bySort }),
      store.list("service_info", { where: mine, limit: 1 }),
      store.list("media", { where: mine, order: bySort }),
    ]);

  return {
    memorial,
    timeline,
    gallery,
    tributes,
    memories: memories.map(publicMemory),
    guestbook: guestbook.map(publicEntry),
    candles: {
      count: candleCount,
      names: candleNames.map((c) => c.name).filter(Boolean).slice(0, 24),
    },
    family,
    service: service[0] ?? null,
    media,
  };
}

export type HomeData = Awaited<ReturnType<typeof getHome>>;

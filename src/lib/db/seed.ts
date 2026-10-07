import "server-only";
import { createHash } from "node:crypto";
import { hashPassword } from "@/lib/auth/password";
import type { Driver } from "./driver";
import biography from "./biography.json";
import type { FamilyGroup, FamilyMember, Memorial, ServiceInfo, TimelineEvent } from "./types";

// The starting content for an empty database. The words come from the family's
// biography, kept in biography.json. Photographs are added from the dashboard.
// Sections with nothing in them stay hidden until the family adds something.

/** Stable ids, so seeding twice (or from two processes at once) is harmless. */
function sid(key: string): string {
  const h = createHash("sha1").update(`memorial-seed:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

const MEMORIAL_ID = sid("memorial");
const NOW = new Date().toISOString();

const memorial: Memorial = {
  id: MEMORIAL_ID,
  slug: "emmanuel-okoro",
  honorific: biography.honorific,
  full_name: "Emmanuel Uvere Okoro",
  short_name: "Emmanuel",
  born_on: "1967-03-15",
  died_on: "2026-09-22",
  birthplace: "Abia State",
  epitaph: "In Loving Memory",
  quote: "",
  quote_source: "",
  hero_image_url: "",
  hero_image_alt: biography.hero_image_alt,
  story_intro: biography.story_intro,
  chapters: biography.chapters.map((c) => ({
    id: sid(`chapter-${c.key}`),
    kicker: c.kicker,
    title: c.title,
    body: c.body,
    pull_quote: "",
    image_url: "",
    image_caption: "",
  })),
  favorites: [{ id: sid("fav-football"), label: "Favourite football club", value: "Arsenal", note: "" }],
  closing_message: biography.closing_message,
  settings: {
    theme: "ivory",
    accent: "#7f5e40",
    share_title: "",
    share_description: "",
    contact_name: "The Okoro family",
    contact_email: "",
    contact_phone: "",
    sections: {
      story: true,
      timeline: true,
      memories: true,
      gallery: true,
      favorites: true,
      media: false,
      tributes: true,
      family: true,
      service: true,
      candles: true,
      guestbook: true,
    },
  },
  created_at: NOW,
  updated_at: NOW,
};

const timeline: TimelineEvent[] = biography.timeline.map(([year, title, description], i) => ({
  id: sid(`timeline-${year}`),
  memorial_id: MEMORIAL_ID,
  year,
  title,
  description,
  sort_order: i,
}));

const family: FamilyMember[] = biography.family.map(([name, family_group, note], i) => ({
  id: sid(`family-${name}`),
  memorial_id: MEMORIAL_ID,
  name,
  family_group: family_group as FamilyGroup,
  note,
  sort_order: i,
}));

const service: ServiceInfo = {
  id: sid("service"),
  memorial_id: MEMORIAL_ID,
  title: "Funeral Service",
  date: "2026-11-06",
  time: "",
  venue: "To be announced",
  address: "",
  map_query: "",
  livestream_url: "",
  dress_code: "",
  notes: "Further details will be shared here as soon as arrangements are confirmed.",
  schedule: [],
};

export async function seed(db: Driver): Promise<void> {
  if ((await db.count("memorials")) === 0) {
    await db.insertMissing("memorials", [memorial]);
    await Promise.all([
      db.insertMissing("timeline_events", timeline),
      db.insertMissing("family_members", family),
      db.insertMissing("service_info", [service]),
    ]);
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password && (await db.count("admin_users")) === 0) {
    await db.insertMissing("admin_users", [
      {
        id: sid(`admin:${email}`),
        email,
        name: "Family administrator",
        password_hash: await hashPassword(password),
        created_at: new Date().toISOString(),
      },
    ]);
  }
}

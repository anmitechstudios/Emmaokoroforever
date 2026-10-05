import "server-only";
import { createHash } from "node:crypto";
import { hashPassword } from "@/lib/auth/password";
import type { Driver } from "./driver";
import type { FamilyMember, Memorial, ServiceInfo, TimelineEvent } from "./types";

// The starting content for an empty database: the memorial as the family has
// described it so far. Photographs are added from the dashboard. Sections with
// nothing in them stay hidden until the family adds something.

/** Stable ids, so seeding twice (or from two processes at once) is harmless. */
function sid(key: string): string {
  const h = createHash("sha1").update(`memorial-seed:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

const MEMORIAL_ID = sid("memorial");
const NOW = new Date().toISOString();

const STORY_INTRO =
  "Engineer, entrepreneur and a man with a deep love for God, Emma was husband to Ugochi and father to three amazing children: Chikezirim, Goziechukwu and Ivuomachukwu.";

const CHAPTERS = [
  {
    key: "beginnings",
    kicker: "Beginnings",
    title: "A son of Arochukwu",
    body:
      "Mazi Engr. Emmanuel Uvere Okoro was born to the late Mazi Emmanuel Okoro Snr. of Nde Owu compound, Ibom village, Arochukwu, and Mrs Rose Okoro (née Iteogu) of Amaogwugwu in Umuahia South Local Government Area of Abia State.\n\nHis father, who had completed his first degree at the University of Nigeria, Nsukka, went on to the University of Sheffield for his Master's degree. That season gave young Emma the gift of being personally groomed by his mother, herself a teacher.",
  },
  {
    key: "school",
    kicker: "School days",
    title: "From Uzuakoli to Owerri",
    body:
      "His primary school days took him from Umuahia to Arochukwu and on to Enugu, before he finished at Methodist Boys' High School, Uzuakoli, where he obtained his school certificate.\n\nHaving finished well in high school, Emma went on to the Federal School of Arts and Science, Aba, and was then admitted into the Federal University of Technology, Owerri. At FUTO he earned a niche as a student with a love for God, showing leadership in the Christian Union, where he served in the music group as drummer and bass guitarist.",
  },
  {
    key: "port-harcourt",
    kicker: "Port Harcourt",
    title: "Enterprise, and Ugochi",
    body:
      "After graduation, Emma found pleasure in Lagos and Port Harcourt, venturing into private enterprise to make his way in life.\n\nIt was in Port Harcourt, at the very popular St. Matthew's Anglican Church, that he met his unassuming, calm and beautiful wife, Ugochi, and it was there that they were eventually wedded.",
  },
  {
    key: "family",
    kicker: "Family",
    title: "Three amazing children",
    body:
      "Their union was blessed with three amazing children: Chikezirim, Goziechukwu and Ivuomachukwu. Ugochi, a sound banker and home builder, has been able to combine motherhood and career effectively.\n\nEmma is survived by his wife Ugochi, his aged mother, his three children and his two siblings, with a host of uncles, aunties, relations and business associates.",
  },
];

const memorial: Memorial = {
  id: MEMORIAL_ID,
  slug: "emmanuel-okoro",
  honorific: "Mazi Engr.",
  full_name: "Emmanuel Uvere Okoro",
  short_name: "Emmanuel",
  born_on: "1967-03-15",
  died_on: "2026-09-22",
  birthplace: "Abia State",
  epitaph: "In Loving Memory",
  quote: "",
  quote_source: "",
  hero_image_url: "",
  hero_image_alt: "Portrait of Mazi Engr. Emmanuel Uvere Okoro",
  story_intro: STORY_INTRO,
  chapters: CHAPTERS.map((c) => ({
    id: sid(`chapter-${c.key}`),
    kicker: c.kicker,
    title: c.title,
    body: c.body,
    pull_quote: "",
    image_url: "",
    image_caption: "",
  })),
  favorites: [{ id: sid("fav-football"), label: "Favourite football club", value: "Arsenal", note: "" }],
  closing_message: "",
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

const timeline: TimelineEvent[] = (
  [
    ["1967", "Born", "To Mazi Emmanuel Okoro Snr. and Mrs Rose Okoro (née Iteogu)."],
    ["2002", "Married Ugochi", "At St. Matthew's Anglican Church, Port Harcourt."],
    ["2026", "Passed on", "On the twenty-second of September."],
  ] as const
).map(([year, title, description], i) => ({
  id: sid(`timeline-${year}`),
  memorial_id: MEMORIAL_ID,
  year,
  title,
  description,
  sort_order: i,
}));

const family: FamilyMember[] = (
  [
    ["Ugochi Okoro", "spouse", "Married for twenty-four years"],
    ["Chikezirim Okoro", "children", ""],
    ["Goziechukwu Okoro", "children", ""],
    ["Ivuomachukwu Okoro", "children", ""],
    ["Ugochukwu Okoro", "siblings", ""],
    ["Mrs Rose Okoro (née Iteogu)", "parents", "His mother · of Amaogwugwu, Umuahia South"],
    ["Mazi Emmanuel Okoro Snr.", "predeceased", "His father · of Nde Owu compound, Ibom village, Arochukwu"],
  ] as const
).map(([name, family_group, note], i) => ({
  id: sid(`family-${name}`),
  memorial_id: MEMORIAL_ID,
  name,
  family_group,
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

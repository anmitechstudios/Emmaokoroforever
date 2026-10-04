// The content model. Every row belongs to a memorial, so one database can hold many.

export type Status = "pending" | "approved" | "rejected";
export const STATUSES: Status[] = ["pending", "approved", "rejected"];

export type ThemeName = "ivory" | "stone" | "evening";

export const SECTION_KEYS = [
  "story",
  "timeline",
  "memories",
  "gallery",
  "favorites",
  "media",
  "tributes",
  "family",
  "service",
  "candles",
  "guestbook",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export interface Chapter {
  id: string;
  kicker: string;
  title: string;
  body: string;
  pull_quote: string;
  image_url: string;
  image_caption: string;
}

export interface Favorite {
  id: string;
  label: string;
  value: string;
  note: string;
}

export interface MemorialSettings {
  theme: ThemeName;
  accent: string;
  share_title: string;
  share_description: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  sections: Record<SectionKey, boolean>;
}

export interface Memorial {
  id: string;
  slug: string;
  honorific: string;
  full_name: string;
  short_name: string;
  born_on: string; // ISO date
  died_on: string; // ISO date
  birthplace: string;
  epitaph: string;
  quote: string;
  quote_source: string;
  hero_image_url: string;
  hero_image_alt: string;
  story_intro: string;
  chapters: Chapter[];
  favorites: Favorite[];
  closing_message: string;
  settings: MemorialSettings;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  memorial_id: string;
  year: string;
  title: string;
  description: string;
  sort_order: number;
}

export const GALLERY_CATEGORIES = [
  "Family",
  "Childhood",
  "Career",
  "Friends",
  "Celebrations",
  "Travel",
  "Special Moments",
] as const;

export interface GalleryImage {
  id: string;
  memorial_id: string;
  url: string;
  width: number;
  height: number;
  caption: string;
  taken: string;
  category: string;
  sort_order: number;
  created_at: string;
}

export interface Tribute {
  id: string;
  memorial_id: string;
  name: string;
  email: string;
  relationship: string;
  message: string;
  photo_url: string;
  status: Status;
  likes: number;
  report_count: number;
  ip_hash: string;
  created_at: string;
}

export interface Memory {
  id: string;
  memorial_id: string;
  name: string;
  relationship: string;
  body: string;
  status: Status;
  ip_hash: string;
  created_at: string;
}

export interface GuestbookEntry {
  id: string;
  memorial_id: string;
  name: string;
  location: string;
  message: string;
  status: Status;
  ip_hash: string;
  created_at: string;
}

export interface Candle {
  id: string;
  memorial_id: string;
  name: string;
  status: Status;
  ip_hash: string;
  created_at: string;
}

export const FAMILY_GROUPS = [
  { key: "spouse", label: "Spouse" },
  { key: "children", label: "Children" },
  { key: "grandchildren", label: "Grandchildren" },
  { key: "siblings", label: "Siblings" },
  { key: "parents", label: "Parents" },
  { key: "predeceased", label: "Reunited with" },
] as const;
export type FamilyGroup = (typeof FAMILY_GROUPS)[number]["key"];

export interface FamilyMember {
  id: string;
  memorial_id: string;
  name: string;
  family_group: FamilyGroup;
  note: string;
  sort_order: number;
}

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  note: string;
}

export interface ServiceInfo {
  id: string;
  memorial_id: string;
  title: string;
  date: string; // ISO date
  time: string;
  venue: string;
  address: string;
  map_query: string;
  livestream_url: string;
  dress_code: string;
  notes: string;
  schedule: ScheduleItem[];
}

export const MEDIA_CATEGORIES = [
  "Recording",
  "Interview",
  "Voice note",
  "Favourite song",
  "Sermon",
  "Speech",
  "Funeral service",
] as const;

export interface MediaItem {
  id: string;
  memorial_id: string;
  kind: "audio" | "video";
  title: string;
  description: string;
  category: string;
  url: string; // uploaded file, or a YouTube / Vimeo link
  poster_url: string;
  recorded: string;
  sort_order: number;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
}

export interface Report {
  id: string;
  memorial_id: string;
  tribute_id: string;
  reason: string;
  ip_hash: string;
  created_at: string;
}

export const TABLES = [
  "memorials",
  "timeline_events",
  "gallery_images",
  "tributes",
  "memories",
  "guestbook_entries",
  "candles",
  "family_members",
  "service_info",
  "media",
  "admin_users",
  "reports",
] as const;
export type Table = (typeof TABLES)[number];

export interface Rows {
  memorials: Memorial;
  timeline_events: TimelineEvent;
  gallery_images: GalleryImage;
  tributes: Tribute;
  memories: Memory;
  guestbook_entries: GuestbookEntry;
  candles: Candle;
  family_members: FamilyMember;
  service_info: ServiceInfo;
  media: MediaItem;
  admin_users: AdminUser;
  reports: Report;
}

/** What visitors are allowed to see of a tribute — never the email or address hash. */
export type PublicTribute = Pick<
  Tribute,
  "id" | "name" | "relationship" | "message" | "photo_url" | "likes" | "created_at"
>;
export type PublicMemory = Pick<Memory, "id" | "name" | "relationship" | "body" | "created_at">;
export type PublicGuestbookEntry = Pick<GuestbookEntry, "id" | "name" | "location" | "message" | "created_at">;

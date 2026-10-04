-- Memorial — database schema for Supabase (PostgreSQL).
--
-- Run this once in the Supabase SQL editor, then set SUPABASE_URL and
-- SUPABASE_SERVICE_ROLE_KEY in the site's environment. On first visit the site
-- fills an empty database with the sample memorial and creates the first
-- administrator from ADMIN_EMAIL / ADMIN_PASSWORD.
--
-- Security model: the website's server is the only client. It connects with the
-- service-role key, which bypasses Row Level Security. RLS is enabled on every
-- table with NO policies, so the public "anon" key can read and write nothing —
-- visitor email addresses cannot be reached from a browser.

create table if not exists memorials (
  id              uuid primary key,
  slug            text not null unique,
  honorific       text not null default '',
  full_name       text not null,
  short_name      text not null,
  born_on         date not null,
  died_on         date not null,
  birthplace      text not null default '',
  epitaph         text not null default 'In Loving Memory',
  quote           text not null default '',
  quote_source    text not null default '',
  hero_image_url  text not null default '',
  hero_image_alt  text not null default '',
  story_intro     text not null default '',
  chapters        jsonb not null default '[]',   -- [{ id, kicker, title, body, pull_quote, image_url, image_caption }]
  favorites       jsonb not null default '[]',   -- [{ id, label, value, note }]
  closing_message text not null default '',
  settings        jsonb not null default '{}',   -- { theme, accent, share_*, contact_*, sections }
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists timeline_events (
  id           uuid primary key,
  memorial_id  uuid not null references memorials (id) on delete cascade,
  year         text not null,
  title        text not null,
  description  text not null default '',
  sort_order   integer not null default 0
);

create table if not exists gallery_images (
  id           uuid primary key,
  memorial_id  uuid not null references memorials (id) on delete cascade,
  url          text not null,
  width        integer not null,
  height       integer not null,
  caption      text not null default '',
  taken        text not null default '',
  category     text not null default '',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists tributes (
  id            uuid primary key,
  memorial_id   uuid not null references memorials (id) on delete cascade,
  name          text not null,
  email         text not null default '',       -- private: never sent to visitors
  relationship  text not null default '',
  message       text not null,
  photo_url     text not null default '',
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  likes         integer not null default 0 check (likes >= 0),
  report_count  integer not null default 0,
  ip_hash       text not null default '',       -- one-way hash, for rate limiting only
  created_at    timestamptz not null default now()
);

create table if not exists memories (
  id            uuid primary key,
  memorial_id   uuid not null references memorials (id) on delete cascade,
  name          text not null,
  relationship  text not null default '',
  body          text not null,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  ip_hash       text not null default '',
  created_at    timestamptz not null default now()
);

create table if not exists guestbook_entries (
  id           uuid primary key,
  memorial_id  uuid not null references memorials (id) on delete cascade,
  name         text not null,
  location     text not null default '',
  message      text not null,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  ip_hash      text not null default '',
  created_at   timestamptz not null default now()
);

create table if not exists candles (
  id           uuid primary key,
  memorial_id  uuid not null references memorials (id) on delete cascade,
  name         text not null default '',
  status       text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  ip_hash      text not null default '',
  created_at   timestamptz not null default now()
);

create table if not exists family_members (
  id            uuid primary key,
  memorial_id   uuid not null references memorials (id) on delete cascade,
  name          text not null,
  family_group  text not null check (family_group in ('spouse', 'children', 'grandchildren', 'siblings', 'parents', 'predeceased')),
  note          text not null default '',
  sort_order    integer not null default 0
);

create table if not exists service_info (
  id              uuid primary key,
  memorial_id     uuid not null unique references memorials (id) on delete cascade,
  title           text not null default '',
  date            text not null default '',     -- ISO day, or empty when not yet known
  time            text not null default '',
  venue           text not null default '',
  address         text not null default '',
  map_query       text not null default '',
  livestream_url  text not null default '',
  dress_code      text not null default '',
  notes           text not null default '',
  schedule        jsonb not null default '[]'   -- [{ id, time, title, note }]
);

create table if not exists media (
  id           uuid primary key,
  memorial_id  uuid not null references memorials (id) on delete cascade,
  kind         text not null check (kind in ('audio', 'video')),
  title        text not null,
  description  text not null default '',
  category     text not null default '',
  url          text not null default '',
  poster_url   text not null default '',
  recorded     text not null default '',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists admin_users (
  id             uuid primary key,
  email          text not null unique,
  name           text not null default '',
  password_hash  text not null,                 -- scrypt
  created_at     timestamptz not null default now()
);

create table if not exists reports (
  id           uuid primary key,
  memorial_id  uuid not null references memorials (id) on delete cascade,
  tribute_id   uuid not null references tributes (id) on delete cascade,
  reason       text not null,
  ip_hash      text not null default '',
  created_at   timestamptz not null default now()
);

-- The lookups the site actually makes.
create index if not exists tributes_public_idx   on tributes (memorial_id, status, created_at desc);
create index if not exists tributes_rate_idx     on tributes (ip_hash, created_at);
create index if not exists memories_public_idx   on memories (memorial_id, status, created_at desc);
create index if not exists memories_rate_idx     on memories (ip_hash, created_at);
create index if not exists guestbook_public_idx  on guestbook_entries (memorial_id, status, created_at desc);
create index if not exists guestbook_rate_idx    on guestbook_entries (ip_hash, created_at);
create index if not exists candles_public_idx    on candles (memorial_id, status, created_at desc);
create index if not exists candles_rate_idx      on candles (ip_hash, created_at);
create index if not exists timeline_order_idx    on timeline_events (memorial_id, sort_order);
create index if not exists gallery_order_idx     on gallery_images (memorial_id, sort_order);
create index if not exists family_order_idx      on family_members (memorial_id, sort_order);
create index if not exists media_order_idx       on media (memorial_id, sort_order);
create index if not exists reports_tribute_idx   on reports (tribute_id, ip_hash);

-- Hearts are counted atomically so two visitors at once never lose a count.
create or replace function adjust_tribute_likes(p_id uuid, p_by integer)
returns integer
language sql
as $$
  update tributes set likes = greatest(0, likes + p_by) where id = p_id returning likes;
$$;

-- Lock everything to the server.
alter table memorials          enable row level security;
alter table timeline_events    enable row level security;
alter table gallery_images     enable row level security;
alter table tributes           enable row level security;
alter table memories           enable row level security;
alter table guestbook_entries  enable row level security;
alter table candles            enable row level security;
alter table family_members     enable row level security;
alter table service_info       enable row level security;
alter table media              enable row level security;
alter table admin_users        enable row level security;
alter table reports            enable row level security;

revoke execute on function adjust_tribute_likes(uuid, integer) from anon, authenticated;

-- Storage for photographs and recordings. Files are public to read (they are
-- shown on the memorial) and can only be written by the server.
insert into storage.buckets (id, name, public)
values ('memorial-media', 'memorial-media', true)
on conflict (id) do nothing;

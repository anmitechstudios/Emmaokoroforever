-- Visit counting. Run this once in the Supabase SQL editor.
-- (New installations get it from schema.sql; this file is for databases created before it existed.)

create table if not exists visits (
  id            uuid primary key,
  memorial_id   uuid not null references memorials (id) on delete cascade,
  path          text not null,
  visitor_hash  text not null default '',   -- one-way fingerprint; no IP address is stored
  created_at    timestamptz not null default now()
);

create index if not exists visits_memorial_idx on visits (memorial_id, created_at);

alter table visits enable row level security;

-- Totals for the dashboard, with days counted in the family's time zone.
create or replace function visit_stats(p_memorial uuid, p_tz text default 'Africa/Lagos')
returns json
language sql
stable
as $$
  with v as (
    select path, visitor_hash, (created_at at time zone p_tz)::date as day
    from visits
    where memorial_id = p_memorial
  ),
  t as (select (now() at time zone p_tz)::date as today),
  series as (select (t.today - n) as day from t, generate_series(0, 29) as n)
  select json_build_object(
    'total',    (select count(*) from v),
    'visitors', (select count(distinct visitor_hash) from v),
    'today',    (select count(*) from v, t where v.day = t.today),
    'week',     (select count(*) from v, t where v.day > t.today - 7),
    'month',    (select count(*) from v, t where v.day > t.today - 30),
    'days',     (select json_agg(json_build_object('day', s.day, 'visits', (select count(*) from v where v.day = s.day)) order by s.day) from series s),
    'pages',    (select coalesce(json_agg(p), '[]'::json)
                 from (select path, count(*) as visits from v group by path order by count(*) desc, path limit 8) p)
  );
$$;

revoke execute on function visit_stats(uuid, text) from anon, authenticated;

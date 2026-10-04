import Link from "next/link";
import type { ReactNode } from "react";
import { ModerationList, type ModerationItem } from "@/components/admin/ModerationList";
import { AdminPage } from "@/components/admin/Shell";
import { Icon } from "@/components/ui/Icon";
import type { Moderated } from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { STATUSES, type Candle, type GuestbookEntry, type Memory, type Status, type Tribute } from "@/lib/db/types";
import { longDate } from "@/lib/format";
import { getMemorial } from "@/lib/queries";

type Row = Tribute | Memory | GuestbookEntry | Candle;

const CONFIG: Record<
  Moderated,
  { path: string; search: string[]; detailField?: "relationship" | "location"; detailLabel?: string; textLabel?: string; toItem: (row: never) => Omit<ModerationItem, "id" | "status" | "created" | "name"> }
> = {
  tributes: {
    path: "/admin/tributes",
    search: ["name", "email", "relationship", "message"],
    detailField: "relationship",
    detailLabel: "Relationship",
    textLabel: "Tribute",
    toItem: (t: Tribute) => ({ detail: t.relationship, text: t.message, email: t.email, photo_url: t.photo_url, likes: t.likes, reports: t.report_count }),
  },
  memories: {
    path: "/admin/memories",
    search: ["name", "relationship", "body"],
    detailField: "relationship",
    detailLabel: "Relationship",
    textLabel: "Memory",
    toItem: (m: Memory) => ({ detail: m.relationship, text: m.body }),
  },
  guestbook_entries: {
    path: "/admin/guestbook",
    search: ["name", "location", "message"],
    detailField: "location",
    detailLabel: "From",
    textLabel: "Message",
    toItem: (g: GuestbookEntry) => ({ detail: g.location, text: g.message }),
  },
  candles: {
    path: "/admin/candles",
    search: ["name"],
    toItem: () => ({ detail: "", text: "" }),
  },
};

export async function ModerationPage({
  table,
  title,
  intro,
  searchParams,
  onlyNamed = false,
  children,
}: {
  table: Moderated;
  title: string;
  intro: string;
  searchParams: Promise<{ status?: string; q?: string }>;
  onlyNamed?: boolean;
  children?: ReactNode;
}) {
  const [{ status: rawStatus, q = "" }, memorial, store] = await Promise.all([searchParams, getMemorial(), db()]);
  const config = CONFIG[table];
  const status = STATUSES.includes(rawStatus as Status) ? (rawStatus as Status) : undefined;
  const mine = { memorial_id: memorial.id };

  const [rows, ...counts] = await Promise.all([
    store.list(table, {
      where: status ? { ...mine, status } : mine,
      search: q ? { columns: config.search, term: q } : undefined,
      order: [{ column: "created_at", ascending: false }],
      limit: 200,
    }) as Promise<Row[]>,
    ...STATUSES.map((s) => store.count(table, { where: { ...mine, status: s } })),
  ]);

  const visible = onlyNamed ? rows.filter((row) => row.name) : rows;
  const items: ModerationItem[] = visible.map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    created: longDate(row.created_at),
    ...config.toItem(row as never),
  }));

  const href = (next?: Status) => {
    const params = new URLSearchParams();
    if (next) params.set("status", next);
    if (q) params.set("q", q);
    const query = params.toString();
    return query ? `${config.path}?${query}` : config.path;
  };
  const tabs: { label: string; status?: Status; count?: number }[] = [
    { label: "All" },
    ...STATUSES.map((s, i) => ({ label: s === "pending" ? "Waiting" : s[0].toUpperCase() + s.slice(1), status: s, count: counts[i] })),
  ];

  return (
    <AdminPage title={title} intro={intro}>
      {children}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Filter by status" className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const active = tab.status === status;
            return (
              <Link
                key={tab.label}
                href={href(tab.status)}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${active ? "bg-ink text-paper" : "text-ink-soft hover:bg-line/50"}`}
              >
                {tab.label}
                {tab.count !== undefined && !onlyNamed && <span className="ml-1.5 tabular-nums opacity-70">{tab.count}</span>}
              </Link>
            );
          })}
        </nav>
        <form action={config.path} className="relative">
          {status && <input type="hidden" name="status" value={status} />}
          <label htmlFor="q" className="sr-only">Search</label>
          <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Search…" className="input w-56 !pl-9" />
        </form>
      </div>

      <ModerationList table={table} items={items} detailField={config.detailField} detailLabel={config.detailLabel} textLabel={config.textLabel} />
      {rows.length === 200 && <p className="text-sm text-muted">Showing the most recent 200. Use search to find older entries.</p>}
    </AdminPage>
  );
}

import Link from "next/link";
import { AdminPage, Panel } from "@/components/admin/Shell";
import { Icon } from "@/components/ui/Icon";
import { db, usingSupabase } from "@/lib/db";
import { longDate } from "@/lib/format";
import { getMemorial } from "@/lib/queries";

export default async function Overview() {
  const [memorial, store] = await Promise.all([getMemorial(), db()]);
  const mine = { memorial_id: memorial.id };
  const pending = { ...mine, status: "pending" };
  const approved = { ...mine, status: "approved" };

  const [tributesWaiting, memoriesWaiting, guestbookWaiting, candlesWaiting, tributes, memories, guestbook, candles, photos, latest] =
    await Promise.all([
      store.count("tributes", { where: pending }),
      store.count("memories", { where: pending }),
      store.count("guestbook_entries", { where: pending }),
      store.count("candles", { where: pending }),
      store.count("tributes", { where: approved }),
      store.count("memories", { where: approved }),
      store.count("guestbook_entries", { where: approved }),
      store.count("candles", { where: mine }),
      store.count("gallery_images", { where: mine }),
      store.list("tributes", { where: pending, order: [{ column: "created_at", ascending: false }], limit: 3 }),
    ]);

  const queue = [
    { href: "/admin/tributes?status=pending", label: "Reported tributes", count: tributesWaiting },
    { href: "/admin/memories?status=pending", label: "Memories", count: memoriesWaiting },
    { href: "/admin/guestbook?status=pending", label: "Guestbook entries", count: guestbookWaiting },
    { href: "/admin/candles?status=pending", label: "Candle names", count: candlesWaiting },
  ];
  const waiting = queue.reduce((sum, q) => sum + q.count, 0);
  const noPortrait = !memorial.hero_image_url;

  return (
    <AdminPage title="Overview" intro="Tributes go live straight away; memories and candle names wait here for your approval, along with any reported tributes.">
      {noPortrait && (
        <div className="rounded border border-[#b98a3c]/40 bg-[#b98a3c]/10 px-5 py-4 text-sm text-[#6a4c16]">
          <strong className="font-medium">There is no portrait yet.</strong> Add one under{" "}
          <Link href="/admin/memorial" className="underline underline-offset-4">Name &amp; portrait</Link>. It is the first thing visitors see.
        </div>
      )}

      <Panel title={waiting ? `${waiting} waiting for you` : "Nothing waiting"} hint={waiting ? "Approve what you'd like to appear on the memorial." : "You're up to date. New messages will appear here."}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {queue.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="flex items-center justify-between rounded border border-line px-4 py-3 transition-colors hover:border-muted">
                <span>{item.label}</span>
                <span className={`font-serif text-3xl lining-nums tabular-nums ${item.count ? "text-accent" : "text-muted/60"}`}>{item.count}</span>
              </Link>
            </li>
          ))}
        </ul>
        {latest.length > 0 && (
          <ul className="mt-6 divide-y divide-line border-t border-line">
            {latest.map((tribute) => (
              <li key={tribute.id} className="py-4">
                <p className="line-clamp-2 font-serif text-lg leading-snug">“{tribute.message}”</p>
                <p className="mt-1 text-sm text-muted">
                  {tribute.name} · {longDate(tribute.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="On the memorial">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-5">
          {[
            ["Tributes", tributes],
            ["Memories", memories],
            ["Guestbook", guestbook],
            ["Candles", candles],
            ["Photographs", photos],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="eyebrow">{label}</dt>
              <dd className="mt-1 font-serif text-4xl font-light lining-nums tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <p className="flex items-center gap-2 text-xs text-muted">
        <Icon name="check" size={14} />
        {usingSupabase ? "Connected to Supabase." : "Using the local file store (.data/). Connect Supabase before going live (see README)."}
      </p>
    </AdminPage>
  );
}

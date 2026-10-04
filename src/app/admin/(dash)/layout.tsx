import Link from "next/link";
import type { ReactNode } from "react";
import { AdminNav, type AdminNavGroup } from "@/components/admin/Shell";
import { Icon } from "@/components/ui/Icon";
import { signOut } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getMemorial } from "@/lib/queries";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const [memorial, store] = await Promise.all([getMemorial(), db()]);
  const waiting = (table: "tributes" | "memories" | "guestbook_entries" | "candles") =>
    store.count(table, { where: { memorial_id: memorial.id, status: "pending" } });
  const [tributes, memories, guestbook, candles] = await Promise.all([waiting("tributes"), waiting("memories"), waiting("guestbook_entries"), waiting("candles")]);

  const groups: AdminNavGroup[] = [
    { label: "Dashboard", links: [{ href: "/admin", label: "Overview" }] },
    {
      label: "From visitors",
      links: [
        { href: "/admin/tributes", label: "Tributes", badge: tributes },
        { href: "/admin/memories", label: "Memories", badge: memories },
        { href: "/admin/guestbook", label: "Guestbook", badge: guestbook },
        { href: "/admin/candles", label: "Candles", badge: candles },
      ],
    },
    {
      label: "The memorial",
      links: [
        { href: "/admin/memorial", label: "Name & portrait" },
        { href: "/admin/story", label: "Life story" },
        { href: "/admin/timeline", label: "Timeline" },
        { href: "/admin/gallery", label: "Photographs" },
        { href: "/admin/favourites", label: "Favourite things" },
        { href: "/admin/recordings", label: "Video & audio" },
        { href: "/admin/family", label: "Family" },
        { href: "/admin/service", label: "Service" },
      ],
    },
    { label: "Site", links: [{ href: "/admin/settings", label: "Settings" }] },
  ];

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[16.5rem_1fr]">
      <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-5">
        <div className="flex items-center justify-between gap-4 px-5 py-4 lg:block lg:px-3 lg:py-2">
          <div>
            <p className="eyebrow">Memorial of</p>
            <p className="mt-1 font-serif text-2xl leading-tight">{memorial.full_name}</p>
          </div>
          <Link href="/" target="_blank" className="inline-flex shrink-0 items-center gap-1.5 text-sm text-muted hover:text-ink lg:mt-3">
            View site <Icon name="arrow-up-right" size={14} />
          </Link>
        </div>
        <div className="lg:mt-7 lg:flex-1">
          <AdminNav groups={groups} />
        </div>
        <form action={signOut} className="hidden border-t border-line px-3 pt-4 lg:block">
          <p className="truncate text-xs text-muted">{admin.email}</p>
          <button type="submit" className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
            <Icon name="logout" size={15} />
            Sign out
          </button>
        </form>
      </aside>
      <main className="min-w-0">
        {children}
        <form action={signOut} className="border-t border-line px-5 py-5 lg:hidden">
          <button type="submit" className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
            <Icon name="logout" size={15} />
            Sign out ({admin.email})
          </button>
        </form>
      </main>
    </div>
  );
}

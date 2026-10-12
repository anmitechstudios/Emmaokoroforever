import type { VisitStats } from "@/lib/db/types";
import { Panel } from "./Shell";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const shortDay = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
const longDay = (iso: string) => `${WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()]} ${shortDay(iso)}`;
const count = (n: number, word = "visit") => `${n.toLocaleString("en")} ${word}${n === 1 ? "" : "s"}`;

const PAGE_NAMES: Record<string, string> = {
  "/": "Memorial (home page)",
  "/gallery": "Photograph gallery",
  "/tributes": "A shared tribute",
  "/privacy": "Privacy & contact",
};

/** A round number at or above the busiest day, so the scale reads cleanly. */
function ceiling(max: number): number {
  if (max <= 4) return 4;
  const step = 10 ** Math.floor(Math.log10(max));
  return [1, 2, 5, 10].map((m) => m * step).find((top) => top >= max) ?? max;
}

export function VisitsPanel({ stats }: { stats: VisitStats | null }) {
  if (!stats) {
    return (
      <Panel title="Visits" hint="Visit counting isn't switched on yet.">
        <p className="text-sm text-ink-soft">
          Run the file <code>supabase/add-visits.sql</code> once in the Supabase SQL editor. Counting begins from that moment.
        </p>
      </Panel>
    );
  }

  const top = ceiling(Math.max(...stats.days.map((d) => d.visits)));
  const ticks = [stats.days[0], stats.days[Math.floor(stats.days.length / 2)], stats.days[stats.days.length - 1]];
  const busiest = Math.max(1, ...stats.pages.map((p) => p.visits));

  return (
    <Panel title="Visits" hint="Each page opened counts once. Your own visits while signed in are left out, and so are search engines and link previews.">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-5">
        {(
          [
            ["Total visits", stats.total],
            ["Visitors", stats.visitors],
            ["Today", stats.today],
            ["Last 7 days", stats.week],
            ["Last 30 days", stats.month],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <dt className="eyebrow">{label}</dt>
            <dd className="mt-1 font-serif text-4xl font-light lining-nums tabular-nums">{value.toLocaleString("en")}</dd>
          </div>
        ))}
      </dl>

      <figure className="mt-9">
        <figcaption className="eyebrow">Visits per day, last 30 days</figcaption>
        <div className="mt-4 flex gap-3">
          {/* Scale */}
          <div className="flex h-40 w-8 shrink-0 flex-col justify-between text-right text-xs tabular-nums text-muted" aria-hidden="true">
            <span className="-translate-y-1/2">{top}</span>
            <span className="translate-y-1/2">0</span>
          </div>
          <div className="min-w-0 flex-1">
            <ul className="relative flex h-40 items-end gap-[2px] border-b border-ink/40 sm:gap-1" aria-label="Visits per day">
              <li className="pointer-events-none absolute inset-x-0 top-0 border-t border-line" aria-hidden="true" />
              <li className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-line" aria-hidden="true" />
              {stats.days.map((d, i) => (
                // Each column is its own hover and keyboard target; the value appears above it.
                <li key={d.day} className="group relative flex h-full flex-1 items-end justify-center outline-none" tabIndex={0} aria-label={`${longDay(d.day)}: ${count(d.visits)}`}>
                  <span
                    className="block w-full max-w-6 rounded-t-[4px] bg-accent-raw transition-opacity group-hover:opacity-70 group-focus-visible:opacity-70"
                    style={{ height: d.visits ? `max(3px, ${(d.visits / top) * 100}%)` : 0 }}
                  />
                  <span
                    className={`pointer-events-none absolute bottom-full z-10 mb-2 hidden whitespace-nowrap rounded border border-line bg-paper px-2.5 py-1.5 text-xs shadow-soft group-hover:block group-focus-visible:block ${
                      i < 5 ? "left-0" : i > stats.days.length - 6 ? "right-0" : "left-1/2 -translate-x-1/2"
                    }`}
                  >
                    <strong className="font-medium tabular-nums text-ink">{count(d.visits)}</strong>
                    <span className="ml-2 text-muted">{longDay(d.day)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-between text-xs tabular-nums text-muted" aria-hidden="true">
              {ticks.map((t) => (
                <span key={t.day}>{shortDay(t.day)}</span>
              ))}
            </div>
          </div>
        </div>

        <details className="mt-4 text-sm">
          <summary className="text-muted hover:text-ink">View as a table</summary>
          <table className="mt-3 w-full max-w-xs text-left tabular-nums">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
                <th className="py-1.5 font-medium">Day</th>
                <th className="py-1.5 text-right font-medium">Visits</th>
              </tr>
            </thead>
            <tbody>
              {[...stats.days].reverse().map((d) => (
                <tr key={d.day} className="border-b border-line/60">
                  <td className="py-1.5">{longDay(d.day)}</td>
                  <td className="py-1.5 text-right">{d.visits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </figure>

      {stats.pages.length > 0 && (
        <div className="mt-9">
          <h3 className="eyebrow !font-sans">Most opened pages</h3>
          <ul className="mt-3 space-y-2.5">
            {stats.pages.map((p) => (
              <li key={p.path} className="grid grid-cols-[minmax(0,12rem)_1fr_auto] items-center gap-3 text-sm">
                <span className="truncate">{PAGE_NAMES[p.path] ?? p.path}</span>
                <span className="h-2 rounded-r-[4px] bg-accent-raw" style={{ width: `max(3px, ${(p.visits / busiest) * 100}%)` }} aria-hidden="true" />
                <span className="tabular-nums text-ink-soft">{p.visits.toLocaleString("en")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

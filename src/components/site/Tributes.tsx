"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { checkMyTributes, likeTribute, reportTribute } from "@/lib/actions/public";
import { copyText, useStored } from "@/lib/client";
import type { PublicTribute } from "@/lib/db/types";
import { longDate } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Reveal } from "@/components/ui/motion";
import { useMyTributes } from "./TributeDialog";

type Sort = "newest" | "loved";
const NO_HEARTS: string[] = [];

const REPORT_REASONS = [
  ["inappropriate", "It's disrespectful or inappropriate"],
  ["spam", "It's spam or advertising"],
  ["inaccurate", "It's inaccurate or about someone else"],
  ["other", "Something else"],
] as const;

export function Tributes({ initial, total: initialTotal }: { initial: PublicTribute[]; total: number }) {
  const [items, setItems] = useState(initial);
  const [total, setTotal] = useState(initialTotal);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hearts, setHearts] = useStored<string[]>("memorial:hearts", NO_HEARTS);
  const [mine, setMine] = useMyTributes();
  const [reporting, setReporting] = useState<PublicTribute | null>(null);
  const untouched = useRef(true);
  const request = useRef(0);
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  const [position, setPosition] = useState(1);

  // Fresh data from the server (after a revalidation) replaces the first page.
  useEffect(() => {
    if (untouched.current) {
      setItems(initial);
      setTotal(initialTotal);
    } else if (!query && sort === "newest") {
      setItems((current) => [...initial.filter((t) => !current.some((c) => c.id === t.id)), ...current]);
      setTotal((current) => Math.max(current, initialTotal));
    }
    // Only when the server sends a new first page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, initialTotal]);

  async function load(offset: number, q: string, order: Sort) {
    const id = ++request.current;
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/tributes?${new URLSearchParams({ q, sort: order, offset: String(offset) })}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { tributes: PublicTribute[]; total: number };
      if (id !== request.current) return;
      setItems((current) => (offset === 0 ? data.tributes : [...current, ...data.tributes.filter((t) => !current.some((c) => c.id === t.id))]));
      setTotal(data.total);
      if (offset === 0) track.current?.scrollTo({ left: 0 });
    } catch {
      if (id === request.current) setFailed(true);
    } finally {
      if (id === request.current) setLoading(false);
    }
  }

  // Search as the visitor types, after a short pause.
  useEffect(() => {
    if (untouched.current) return;
    const timer = setTimeout(() => load(0, query, sort), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sort]);

  // Forget our own submissions once the family has reviewed them.
  useEffect(() => {
    if (!mine.length) return;
    let cancelled = false;
    checkMyTributes(mine.map((t) => t.id)).then((pending) => {
      if (!cancelled && pending.length !== mine.length) setMine(mine.filter((t) => pending.includes(t.id)));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine.length]);

  function heart(tribute: PublicTribute) {
    const on = !hearts.includes(tribute.id);
    setHearts(on ? [...hearts, tribute.id] : hearts.filter((id) => id !== tribute.id));
    setItems((current) => current.map((t) => (t.id === tribute.id ? { ...t, likes: Math.max(0, t.likes + (on ? 1 : -1)) } : t)));
    likeTribute(tribute.id, on).then((result) => {
      if (result) setItems((current) => current.map((t) => (t.id === tribute.id ? { ...t, likes: result.likes } : t)));
    });
  }

  const waiting = query ? [] : mine.filter((t) => !items.some((i) => i.id === t.id));
  const cards = [...waiting.map((t) => ({ tribute: t, pending: true })), ...items.map((t) => ({ tribute: t, pending: false }))];

  // ── Carousel ──────────────────────────────────────────────────────────
  const stride = () => {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    return el && card ? card.offsetWidth + (parseFloat(getComputedStyle(el).columnGap) || 0) : 0;
  };

  function measure() {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft > max - 8 });
    const width = stride();
    if (width) setPosition(Math.min(cards.length, Math.round(el.scrollLeft / width) + 1));
    // Fetch the next page as the visitor nears the end.
    if (max > 0 && max - el.scrollLeft < el.clientWidth && items.length < total && !loading) {
      untouched.current = false;
      load(items.length, query, sort);
    }
  }

  function slide(by: number) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.current?.scrollBy({ left: by * stride(), behavior: reduce ? "auto" : "smooth" });
  }

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // Re-measure whenever the set of cards changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length]);

  return (
    <>
      <div className="no-print mt-12 flex flex-col gap-5 border-y border-line py-4 sm:flex-row sm:items-center sm:justify-between lg:mt-16">
        <label className="flex flex-1 items-center gap-3 text-muted focus-within:text-ink">
          <Icon name="search" />
          <span className="sr-only">Search tributes</span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              untouched.current = false;
              setQuery(event.target.value);
            }}
            placeholder="Search tributes by name or word"
            className="w-full bg-transparent py-2 text-base text-ink placeholder:text-muted/70 focus:outline-none"
          />
        </label>
        <div className="flex items-center gap-1" role="group" aria-label="Sort tributes">
          {(["newest", "loved"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={sort === option}
              onClick={() => {
                untouched.current = false;
                setSort(option);
              }}
              className={`rounded-full px-4 py-2 text-[0.6875rem] font-medium uppercase tracking-[0.16em] transition-colors duration-500 ${
                sort === option ? "bg-ink text-paper" : "text-muted hover:text-ink"
              }`}
            >
              {option === "newest" ? "Most recent" : "Most loved"}
            </button>
          ))}
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {loading ? "Loading tributes" : `${total} ${total === 1 ? "tribute" : "tributes"}`}
      </p>

      {cards.length === 0 && !loading ? (
        <p className="py-20 text-center font-serif text-2xl italic text-muted">
          {query ? `No tributes mention “${query}”.` : "Be the first to leave a tribute."}
        </p>
      ) : (
        <Reveal className="mt-10">
          <div
            ref={track}
            onScroll={measure}
            // `relative` (below) contains the cards' visually hidden text, so off-screen cards cannot widen the page.
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label={`Tributes, ${total} in all. Scroll sideways or use the arrow buttons.`}
            className={`scrollbar-none relative -mx-[clamp(1.25rem,5vw,4.5rem)] flex snap-x snap-mandatory scroll-px-[clamp(1.25rem,5vw,4.5rem)] gap-5 overflow-x-auto px-[clamp(1.25rem,5vw,4.5rem)] pb-2 transition-opacity duration-500 lg:gap-7 ${
              loading ? "opacity-70" : ""
            }`}
          >
            {cards.map(({ tribute, pending }) => (
              <div
                key={tribute.id}
                className="flex shrink-0 basis-[86%] snap-start sm:basis-[calc((100%-1.25rem)/2)] lg:basis-[calc((100%-3.5rem)/3)]"
              >
                <TributeCard
                  tribute={tribute}
                  pending={pending}
                  hearted={hearts.includes(tribute.id)}
                  onHeart={() => heart(tribute)}
                  onReport={() => setReporting(tribute)}
                />
              </div>
            ))}
          </div>

          {!(edges.start && edges.end) && (
            <div className="no-print mt-8 flex items-center justify-between">
              <p className="text-xs tabular-nums tracking-[0.2em] text-muted" aria-hidden="true">
                {String(position).padStart(2, "0")} <span className="mx-1 opacity-50">/</span> {String(Math.max(total, cards.length)).padStart(2, "0")}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => slide(-1)}
                  disabled={edges.start}
                  aria-label="Previous tributes"
                  className="grid size-12 place-items-center rounded-full border border-ink/25 transition-colors duration-500 hover:border-ink hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-30"
                >
                  <Icon name="arrow-left" />
                </button>
                <button
                  type="button"
                  onClick={() => slide(1)}
                  disabled={edges.end}
                  aria-label="More tributes"
                  className="grid size-12 place-items-center rounded-full border border-ink/25 transition-colors duration-500 hover:border-ink hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-30"
                >
                  <Icon name="arrow-right" />
                </button>
              </div>
            </div>
          )}
        </Reveal>
      )}

      {failed && (
        <p role="alert" className="mt-8 text-center text-sm text-muted">
          We couldn't load the tributes just now. Please try again.
        </p>
      )}

      <ReportDialog tribute={reporting} onClose={() => setReporting(null)} />
    </>
  );
}

function TributeCard({
  tribute,
  pending,
  hearted,
  onHeart,
  onReport,
}: {
  tribute: PublicTribute;
  pending: boolean;
  hearted: boolean;
  onHeart: () => void;
  onReport: () => void;
}) {
  const long = tribute.message.length > 240;
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/tributes/${tribute.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `A tribute from ${tribute.name}`, url });
        return;
      } catch {
        return; // The visitor dismissed the share sheet.
      }
    }
    if (await copyText(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  }

  return (
    <article className="card flex w-full flex-col p-7 sm:p-8">
      {pending && (
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
          <Icon name="clock" size={13} />
          Your tribute · awaiting the family's review
        </p>
      )}
      {tribute.photo_url && (
        <div className="relative mb-7 aspect-[4/3] overflow-hidden rounded-[2px] bg-line/40">
          <Image src={tribute.photo_url} alt={`Photograph shared by ${tribute.name}`} fill sizes="(min-width: 768px) 40vw, 90vw" className="object-cover" />
        </div>
      )}
      <span className="block h-7 font-serif text-6xl leading-none text-accent" aria-hidden="true">
        “
      </span>
      <blockquote className="mt-3 whitespace-pre-line font-serif text-[1.25rem] leading-[1.5] sm:text-[1.3125rem]">
        {long && !expanded ? `${tribute.message.slice(0, 210).replace(/\s+\S*$/, "")}…` : tribute.message}
      </blockquote>
      {long && (
        <button type="button" className="link-line no-print mt-4 self-start" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show less" : "Read in full"}
        </button>
      )}

      <div className="mt-auto pt-8">
      <footer className="border-t border-line pt-5">
        <div className="min-w-0">
          <p className="font-medium leading-snug">{tribute.name}</p>
          <p className="mt-0.5 text-[0.8125rem] text-muted">
            {tribute.relationship && <span className="font-serif text-base italic">{tribute.relationship} · </span>}
            <time dateTime={tribute.created_at}>{longDate(tribute.created_at)}</time>
          </p>
        </div>

        {!pending && (
          <div className="no-print -ml-2.5 mt-2 flex items-center text-muted">
            <button
              type="button"
              onClick={onHeart}
              aria-pressed={hearted}
              aria-label={`${hearted ? "Remove your heart from" : "Send a heart for"} ${tribute.name}'s tribute. ${tribute.likes} so far.`}
              className={`flex h-10 items-center gap-1.5 rounded-full px-2.5 text-[0.8125rem] tabular-nums transition-colors duration-300 hover:text-accent ${hearted ? "text-accent" : ""}`}
            >
              <Icon name="heart" size={17} fill={hearted ? "currentColor" : "none"} className="transition-transform duration-500 ease-calm active:scale-125" />
              {tribute.likes > 0 && tribute.likes}
            </button>
            <button
              type="button"
              onClick={share}
              aria-label={`Share ${tribute.name}'s tribute`}
              className="grid size-10 place-items-center rounded-full transition-colors duration-300 hover:text-ink"
            >
              <Icon name={copied ? "check" : "share"} size={17} />
            </button>
            <button
              type="button"
              onClick={onReport}
              aria-label={`Report ${tribute.name}'s tribute`}
              className="grid size-10 place-items-center rounded-full transition-colors duration-300 hover:text-ink"
            >
              <Icon name="flag" size={16} />
            </button>
            <span className="sr-only" role="status">
              {copied ? "Link copied" : ""}
            </span>
          </div>
        )}
      </footer>
      </div>
    </article>
  );
}

function ReportDialog({ tribute, onClose }: { tribute: PublicTribute | null; onClose: () => void }) {
  const [reason, setReason] = useState<string>("inappropriate");
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (tribute) {
      setDone(false);
      setReason("inappropriate");
    }
  }, [tribute]);

  return (
    <Modal open={tribute !== null} onClose={onClose} labelledBy="report-title" size="sm">
      <div className="px-6 pb-8 pt-12 sm:px-10 sm:pb-10">
        {done ? (
          <div role="status">
            <h2 id="report-title" className="font-serif text-3xl">
              Thank you.
            </h2>
            <p className="mt-3 text-ink-soft">The family has been told and will look at this tribute.</p>
            <button type="button" className="btn btn-outline mt-8" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!tribute) return;
              start(async () => {
                await reportTribute(tribute.id, reason);
                setDone(true);
              });
            }}
          >
            <h2 id="report-title" className="font-serif text-3xl">
              Report this tribute
            </h2>
            <p className="mt-3 text-[0.9375rem] text-ink-soft">
              Tell the family why the tribute from <strong className="font-medium">{tribute?.name}</strong> should be looked at again.
            </p>
            <fieldset className="mt-6 space-y-1">
              <legend className="sr-only">Reason</legend>
              {REPORT_REASONS.map(([value, label]) => (
                <label key={value} className="flex cursor-pointer items-center gap-3 py-2 text-[0.9375rem]">
                  <input
                    type="radio"
                    name="reason"
                    value={value}
                    checked={reason === value}
                    onChange={() => setReason(value)}
                    className="size-4 accent-[var(--ink)]"
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <div className="mt-8 flex items-center gap-6">
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? "Sending…" : "Send report"}
              </button>
              <button type="button" className="link-line" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

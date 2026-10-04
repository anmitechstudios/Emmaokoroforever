"use client";

import { useState, useTransition } from "react";
import { lightCandle, nameCandle } from "@/lib/actions/public";
import { useStored } from "@/lib/client";

type Mine = { lit: boolean; id?: string; named?: boolean };
const UNLIT: Mine = { lit: false };

/** A symbolic gesture: one candle, lit once, with a name if the visitor wishes. */
export function Candle({ count, names, shortName }: { count: number; names: string[]; shortName: string }) {
  const [mine, setMine] = useStored<Mine>("memorial:candle", UNLIT);
  // The count including our own candle, until the refreshed page catches up.
  const [floor, setFloor] = useState(0);
  const [notice, setNotice] = useState("");
  const [pending, start] = useTransition();
  const total = Math.max(count, floor);

  function light() {
    start(async () => {
      const result = await lightCandle();
      if (result.ok) setFloor(count + 1);
      else setNotice(result.message ?? "");
      setMine({ lit: true, id: result.id });
    });
  }

  function addName(form: FormData) {
    if (!mine.id) return;
    start(async () => {
      const result = await nameCandle(mine.id!, form);
      if (result.ok) {
        setMine({ lit: true, named: true });
        setNotice("");
      } else setNotice(result.message ?? "Please try again.");
    });
  }

  return (
    <section id="candle" className="bg-night text-night-ink" aria-labelledby="candle-title">
      <div className="shell grid items-center gap-12 py-24 md:grid-cols-2 lg:gap-8 lg:py-36">
        <div className="flex justify-center md:order-2">
          <CandleArt lit={mine.lit} />
        </div>

        <div className="mx-auto max-w-md text-center md:order-1 md:mx-0 md:text-left">
          <p className="eyebrow !text-night-ink/60">A quiet gesture</p>
          <h2 id="candle-title" className="mt-6 text-title font-light leading-[1.02]">
            Light a <em>candle</em>
          </h2>
          <p className="mt-6 text-night-ink/75">
            A small flame, kept here in remembrance of {shortName}. Light one, and stay a moment.
          </p>

          <div className="no-print mt-10 min-h-[7.5rem]" aria-live="polite">
            {!mine.lit && (
              <button type="button" className="btn btn-light" onClick={light} disabled={pending}>
                {pending ? "Lighting…" : "Light a Candle"}
              </button>
            )}

            {mine.lit && mine.id && !mine.named && (
              <form action={addName} className="mx-auto max-w-sm md:mx-0">
                <label htmlFor="candle-name" className="block font-serif text-xl italic">
                  Your candle is lit. Would you like to add your name?
                </label>
                <div className="mt-4 flex items-end gap-4">
                  <input
                    id="candle-name"
                    name="name"
                    maxLength={40}
                    autoComplete="name"
                    placeholder="Your name (optional)"
                    className="w-full border-0 border-b border-white/25 bg-transparent py-2.5 text-night-ink placeholder:text-night-ink/40 focus:border-white/80 focus:outline-none"
                  />
                  <button type="submit" className="link-line shrink-0 !text-night-ink" disabled={pending}>
                    Add
                  </button>
                </div>
              </form>
            )}

            {mine.lit && (!mine.id || mine.named) && (
              <p className="font-serif text-xl italic">
                {mine.named ? "Thank you. Your name will join the others shortly." : "Your candle is burning. Thank you."}
              </p>
            )}

            {notice && <p className="mt-4 text-sm text-night-ink/70">{notice}</p>}
          </div>

          <p className="mt-10 border-t border-white/15 pt-6 text-[0.8125rem] uppercase tracking-[0.2em] text-night-ink/60">
            <span className="tabular-nums text-night-ink">{total}</span> {total === 1 ? "candle" : "candles"} lit
          </p>
          {names.length > 0 && (
            <p className="mt-4 font-serif text-lg italic leading-relaxed text-night-ink/70">
              {names.join(" · ")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function CandleArt({ lit }: { lit: boolean }) {
  const fade = "transition-opacity duration-[2400ms] ease-calm";
  return (
    <svg viewBox="0 0 240 360" className="h-72 w-auto lg:h-[26rem]" role="img" aria-label={lit ? "A lit candle" : "An unlit candle"}>
      <defs>
        <radialGradient id="candle-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f5d9a8" stopOpacity="0.5" />
          <stop offset="45%" stopColor="#e9b872" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#e9b872" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="candle-wax" x1="0" x2="1">
          <stop offset="0%" stopColor="#d8cdb9" />
          <stop offset="45%" stopColor="#f3ecdf" />
          <stop offset="100%" stopColor="#cfc3ad" />
        </linearGradient>
        <linearGradient id="candle-flame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#e8a85c" />
          <stop offset="55%" stopColor="#f7dfae" />
          <stop offset="100%" stopColor="#fffaf0" />
        </linearGradient>
      </defs>

      <circle cx="120" cy="112" r="120" fill="url(#candle-glow)" className={fade} opacity={lit ? 1 : 0} />
      <ellipse cx="120" cy="338" rx="62" ry="7" fill="#000" opacity="0.35" />
      <rect x="92" y="170" width="56" height="168" rx="5" fill="url(#candle-wax)" />
      <ellipse cx="120" cy="171" rx="28" ry="5.500" fill="#f6f0e4" />
      <rect x="92" y="170" width="56" height="168" rx="5" fill="#1b1917" className={fade} opacity={lit ? 0 : 0.35} />
      <path d="M120 171v-15" stroke="#3a322a" strokeWidth="2.200" strokeLinecap="round" />

      <g className={fade} opacity={lit ? 1 : 0}>
        <path className="flame" d="M120 160c-13 0-19-10-16-23 3-13 13-20 16-39 5 17 17 27 17 41 0 12-7 21-17 21Z" fill="url(#candle-flame)" />
        <path className="flame" d="M120 158c-5 0-8-4-7-9 1-6 5-9 7-17 2 8 7 12 7 18 0 5-3 8-7 8Z" fill="#fffdf6" opacity="0.85" />
      </g>
    </svg>
  );
}

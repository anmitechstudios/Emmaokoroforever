"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { MediaItem } from "@/lib/db/types";
import { embedUrl } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/motion";

export function Media({ items }: { items: MediaItem[] }) {
  const audio = items.filter((i) => i.kind === "audio");
  const video = items.filter((i) => i.kind === "video");

  return (
    <div className="mt-14 space-y-10 lg:mt-20">
      {video.length > 0 && (
        <ul className="grid gap-8 md:grid-cols-2 lg:gap-10">
          {video.map((item, i) => (
            <Reveal as="li" key={item.id} delay={(i % 2) * 0.1}>
              <VideoCard item={item} />
            </Reveal>
          ))}
        </ul>
      )}
      {audio.length > 0 && (
        <ul className="grid gap-5 lg:grid-cols-2">
          {audio.map((item, i) => (
            <Reveal as="li" key={item.id} delay={(i % 2) * 0.1}>
              <AudioPlayer item={item} />
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  );
}

function Meta({ item }: { item: MediaItem }) {
  return (
    <p className="eyebrow">
      {[item.category, item.recorded].filter(Boolean).join(" · ")}
    </p>
  );
}

function VideoCard({ item }: { item: MediaItem }) {
  const [playing, setPlaying] = useState(false);
  const embed = item.url ? embedUrl(item.url) : null;
  const available = Boolean(item.url);

  return (
    <article>
      <div className="relative aspect-video overflow-hidden rounded-[2px] bg-night">
        {playing && embed && (
          <iframe
            src={embed}
            title={item.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        )}
        {playing && !embed && (
          // Uploaded home recordings rarely come with captions.
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={item.url} controls autoPlay playsInline className="absolute inset-0 h-full w-full bg-black" />
        )}
        {!playing && (
          <button
            type="button"
            disabled={!available}
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 block w-full disabled:cursor-default"
            aria-label={available ? `Play video: ${item.title}` : `${item.title}, not yet available`}
          >
            {item.poster_url && (
              <Image
                src={item.poster_url}
                alt=""
                fill
                sizes="(min-width: 768px) 45vw, 92vw"
                className="object-cover transition-transform duration-[1600ms] ease-calm group-enabled:group-hover:scale-[1.03]"
              />
            )}
            <span className="absolute inset-0 bg-night/20 transition-colors duration-700 group-enabled:group-hover:bg-night/10" aria-hidden="true" />
            {available ? (
              <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-night transition-transform duration-700 ease-calm group-hover:scale-105">
                <Icon name="play" size={22} fill="currentColor" stroke="none" className="translate-x-[1px]" />
              </span>
            ) : (
              <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3.5 py-2 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-night">
                Coming soon
              </span>
            )}
          </button>
        )}
      </div>
      <div className="mt-5">
        <Meta item={item} />
        <h3 className="mt-2 font-serif text-2xl lg:text-[1.75rem]">{item.title}</h3>
        {item.description && <p className="mt-1.5 max-w-md text-[0.9375rem] text-muted">{item.description}</p>}
      </div>
    </article>
  );
}

function clock(seconds: number): string {
  if (!Number.isFinite(seconds)) return "–:––";
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** A deliberately quiet player: one button, one line, two numbers. */
function AudioPlayer({ item }: { item: MediaItem }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(NaN);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    // Only one recording should sound at a time.
    const others = () => document.querySelectorAll("audio").forEach((other) => other !== el && other.pause());
    el.addEventListener("play", others);
    return () => el.removeEventListener("play", others);
  }, []);

  const percent = duration ? (time / duration) * 100 : 0;

  return (
    <article className="card flex items-center gap-5 p-5 sm:gap-6 sm:p-7">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audio}
        src={item.url}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onDurationChange={(event) => setDuration(event.currentTarget.duration)}
      />
      <button
        type="button"
        onClick={() => (playing ? audio.current?.pause() : audio.current?.play())}
        className="grid size-14 shrink-0 place-items-center rounded-full border border-ink/25 transition-colors duration-500 hover:border-ink hover:bg-ink hover:text-paper"
        aria-label={`${playing ? "Pause" : "Play"}: ${item.title}`}
      >
        <Icon name={playing ? "pause" : "play"} size={20} fill={playing ? "none" : "currentColor"} strokeWidth={playing ? 1.75 : 0} className={playing ? "" : "translate-x-[1px]"} />
      </button>

      <div className="min-w-0 flex-1">
        <Meta item={item} />
        <h3 className="mt-1.5 truncate font-serif text-2xl leading-tight">{item.title}</h3>
        <div className="mt-3 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={Number.isFinite(duration) ? duration : 0}
            step={0.1}
            value={time}
            disabled={!Number.isFinite(duration)}
            onChange={(event) => {
              const next = Number(event.target.value);
              setTime(next);
              if (audio.current) audio.current.currentTime = next;
            }}
            className="scrub flex-1"
            style={{ "--progress": `${percent}%` } as React.CSSProperties}
            aria-label={`Position in ${item.title}`}
            aria-valuetext={`${clock(time)} of ${clock(duration)}`}
          />
          <span className="shrink-0 text-xs tabular-nums text-muted">
            {clock(time)} / {clock(duration)}
          </span>
        </div>
        {item.description && <p className="mt-3 text-[0.8125rem] leading-snug text-muted">{item.description}</p>}
      </div>
    </article>
  );
}

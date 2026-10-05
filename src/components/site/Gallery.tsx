"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GALLERY_CATEGORIES, type GalleryImage } from "@/lib/db/types";
import { Icon } from "@/components/ui/Icon";
import { EASE } from "@/components/ui/motion";

const ALL = "All";

/**
 * The photograph album. With `preview`, only the first few photographs are
 * shown, fading out into a link to the full gallery page.
 */
export function Gallery({ images, preview }: { images: GalleryImage[]; preview?: number }) {
  const [category, setCategory] = useState(ALL);
  const [active, setActive] = useState<number | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const categories = useMemo(() => {
    const present = new Set(images.map((i) => i.category).filter(Boolean));
    const known = GALLERY_CATEGORIES.filter((c) => present.has(c));
    const custom = [...present].filter((c) => !(GALLERY_CATEGORIES as readonly string[]).includes(c));
    return [ALL, ...known, ...custom];
  }, [images]);

  const shown = useMemo(() => {
    if (preview) return images.slice(0, preview);
    return category === ALL ? images : images.filter((i) => i.category === category);
  }, [images, category, preview]);

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <>
      {!preview && (
      <div className="no-print mt-12 flex flex-wrap items-center justify-between gap-x-8 gap-y-5 lg:mt-16">
        {categories.length > 2 ? (
          <div className="-mx-1 flex flex-wrap gap-1" role="group" aria-label="Filter photographs">
            {categories.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={category === name}
                onClick={() => setCategory(name)}
                className={`rounded-full px-4 py-2 text-[0.6875rem] font-medium uppercase tracking-[0.16em] transition-colors duration-500 ${
                  category === name ? "bg-ink text-paper" : "text-muted hover:text-ink"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-6">
          {selecting && selected.size > 0 && (
            <a href={`/api/photos?ids=${[...selected].join(",")}`} download className="link-line">
              <Icon name="download" size={16} />
              Download {selected.size}
            </a>
          )}
          <button
            type="button"
            className="link-line"
            aria-pressed={selecting}
            onClick={() => {
              setSelecting(!selecting);
              setSelected(new Set());
            }}
          >
            {selecting ? "Done" : "Select photographs"}
          </button>
        </div>
      </div>
      )}

      <div className={preview ? "relative max-h-[40rem] overflow-hidden sm:max-h-[46rem] lg:max-h-[52rem]" : undefined}>
      <motion.ul
        key={category}
        data-reveal
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="mt-10 columns-2 gap-x-4 md:columns-3 lg:gap-x-6 3xl:columns-4"
      >
        {shown.map((image, index) => {
          const checked = selected.has(image.id);
          return (
            <motion.li
              key={image.id}
              data-reveal
              className="mb-6 break-inside-avoid lg:mb-9"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -8% 0px" }}
              transition={{ duration: 0.9, ease: EASE, delay: (index % 3) * 0.07 }}
            >
              <figure>
                <button
                  type="button"
                  className="group relative block w-full overflow-hidden rounded-[2px] bg-line/40"
                  onClick={() => (selecting ? toggle(image.id) : setActive(index))}
                  aria-label={
                    selecting
                      ? `${checked ? "Deselect" : "Select"} photograph: ${image.caption || "untitled"}`
                      : `View photograph: ${image.caption || "untitled"}`
                  }
                  aria-pressed={selecting ? checked : undefined}
                >
                  <Image
                    src={image.url}
                    alt={image.caption || "Photograph"}
                    width={image.width}
                    height={image.height}
                    sizes="(min-width: 1792px) 22vw, (min-width: 768px) 30vw, 46vw"
                    className={`h-auto w-full transition-transform duration-[1400ms] ease-calm group-hover:scale-[1.035] ${
                      selecting && !checked ? "opacity-70" : ""
                    }`}
                  />
                  {selecting && (
                    <span
                      className={`absolute right-3 top-3 grid size-7 place-items-center rounded-full border transition-colors duration-300 ${
                        checked ? "border-ink bg-ink text-paper" : "border-white bg-white/50 text-transparent"
                      }`}
                      aria-hidden="true"
                    >
                      <Icon name="check" size={14} strokeWidth={2} />
                    </span>
                  )}
                </button>
                {(image.caption || image.taken) && (
                  <figcaption className="mt-3 flex items-baseline justify-between gap-4 text-[0.8125rem] leading-snug">
                    <span className="text-ink-soft">{image.caption}</span>
                    {image.taken && <span className="shrink-0 tabular-nums text-muted">{image.taken}</span>}
                  </figcaption>
                )}
              </figure>
            </motion.li>
          );
        })}
      </motion.ul>
      {preview && (
        <div className="no-print pointer-events-none absolute inset-x-0 bottom-0 flex h-72 items-end justify-center bg-gradient-to-t from-paper via-paper/85 to-transparent pb-2">
          <Link href="/gallery" className="btn btn-primary pointer-events-auto">
            View all {images.length} photographs
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
      )}
      </div>

      <Lightbox images={shown} index={active} onChange={setActive} />
    </>
  );
}

function Lightbox({
  images,
  index,
  onChange,
}: {
  images: GalleryImage[];
  index: number | null;
  onChange: (index: number | null) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [direction, setDirection] = useState(1);
  const open = index !== null;
  const image = open ? images[index] : null;

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const step = useCallback(
    (by: number) => {
      if (index === null) return;
      setDirection(by);
      onChange((index + by + images.length) % images.length);
    },
    [index, images.length, onChange],
  );

  return (
    <dialog
      ref={dialog}
      className="sheet sheet-full"
      aria-label="Photograph viewer"
      onClose={() => onChange(null)}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") step(1);
        if (event.key === "ArrowLeft") step(-1);
      }}
    >
      {image && index !== null && (
        <div className="flex h-full flex-col text-night-ink">
          <div className="flex shrink-0 items-center justify-between px-4 py-3 sm:px-8 sm:py-5">
            <p className="text-xs tabular-nums tracking-[0.2em] text-night-ink/70" aria-live="polite">
              {String(index + 1).padStart(2, "0")} <span className="mx-1 text-night-ink/40">/</span> {String(images.length).padStart(2, "0")}
            </p>
            <div className="flex items-center gap-1">
              <a
                href={`/api/photos?ids=${image.id}`}
                download
                className="grid size-11 place-items-center rounded-full text-night-ink/70 transition-colors hover:text-white"
                aria-label="Download this photograph"
              >
                <Icon name="download" size={20} />
              </a>
              <button
                type="button"
                autoFocus
                onClick={() => onChange(null)}
                className="grid size-11 place-items-center rounded-full text-night-ink/70 transition-colors hover:text-white"
                aria-label="Close viewer"
              >
                <Icon name="close" size={22} />
              </button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1">
            <AnimatePresence initial={false} mode="popLayout" custom={direction}>
              <motion.div
                key={image.id}
                custom={direction}
                className="absolute inset-0 touch-pan-y px-4 sm:px-20"
                variants={{
                  enter: (d: number) => ({ opacity: 0, x: d * 40, scale: 0.985 }),
                  center: { opacity: 1, x: 0, scale: 1 },
                  exit: (d: number) => ({ opacity: 0, x: d * -40, scale: 0.985 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.6, ease: EASE }}
                drag={images.length > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.35}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -70 || info.velocity.x < -500) step(1);
                  else if (info.offset.x > 70 || info.velocity.x > 500) step(-1);
                }}
              >
                <div className="relative h-full w-full">
                  <Image
                    src={image.url}
                    alt={image.caption || "Photograph"}
                    fill
                    sizes="100vw"
                    quality={85}
                    draggable={false}
                    className="pointer-events-none select-none object-contain"
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="absolute left-3 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 text-night-ink/80 transition-colors hover:border-white/60 hover:text-white sm:grid"
                  aria-label="Previous photograph"
                >
                  <Icon name="arrow-left" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="absolute right-3 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 text-night-ink/80 transition-colors hover:border-white/60 hover:text-white sm:grid"
                  aria-label="Next photograph"
                >
                  <Icon name="arrow-right" />
                </button>
              </>
            )}
          </div>

          <div className="shrink-0 px-6 pb-8 pt-5 text-center sm:pb-10">
            <p className="font-serif text-xl italic sm:text-2xl">{image.caption || " "}</p>
            <p className="mt-2 text-[0.6875rem] uppercase tracking-[0.2em] text-night-ink/60">
              {[image.taken, image.category].filter(Boolean).join(" · ") || " "}
            </p>
            {images.length > 1 && <p className="mt-4 text-xs text-night-ink/40 sm:hidden">Swipe to see more</p>}
          </div>
        </div>
      )}
    </dialog>
  );
}

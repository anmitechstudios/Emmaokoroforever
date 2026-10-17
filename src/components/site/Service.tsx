import Image from "next/image";
import type { ServiceInfo } from "@/lib/db/types";
import { arrangementDays, directionsUrl } from "@/lib/arrangements";
import { dayParts } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/motion";

/** The family's printed programme, shown beside the arrangements. */
export type Programme = { src: string; width: number; height: number; alt: string };

/** The funeral arrangements, set out like a printed order of events: one row per day. */
export function Service({ service, programme }: { service: ServiceInfo; programme?: Programme }) {
  const days = arrangementDays(service);

  return (
    <div className={`mt-14 lg:mt-20 ${programme ? "grid gap-14 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_20rem]" : ""}`}>
    <div className="min-w-0">
      {service.notes && (
        <Reveal>
          <p className="max-w-2xl font-serif text-xl italic leading-snug text-ink-soft">{service.notes}</p>
        </Reveal>
      )}

      <ol className={`border-t border-line ${service.notes ? "mt-10" : ""}`}>
        {days.map((day) => {
          const when = day.date ? dayParts(day.date) : null;
          return (
            <Reveal as="li" key={day.date || "tbc"} className="grid gap-6 border-b border-line py-10 lg:grid-cols-[15rem_1fr] lg:gap-12 lg:py-14">
              <div>
                {when ? (
                  <time dateTime={day.date} className="block">
                    <span className="eyebrow block">{when.weekday}</span>
                    <span className="mt-2 block font-serif text-4xl font-light leading-none lining-nums lg:text-5xl">{when.dayMonth}</span>
                    <span className="mt-2 block text-[0.8125rem] tabular-nums tracking-wide text-muted">{when.year}</span>
                  </time>
                ) : (
                  <span className="font-serif text-3xl font-light italic text-muted">Date to be confirmed</span>
                )}
              </div>

              <ul className="space-y-9">
                {day.events.map((event) => {
                  const directions = directionsUrl(event.map_query);
                  return (
                    <li key={event.id} className="grid gap-x-6 gap-y-1 sm:grid-cols-[10.5rem_1fr]">
                      <p className="pt-1.5 text-[0.8125rem] uppercase tabular-nums tracking-[0.12em] text-accent">{event.time}</p>
                      <div>
                        <h3 className="font-serif text-2xl leading-tight lg:text-[1.75rem]">{event.title}</h3>
                        {event.venue && <p className="mt-2 whitespace-pre-line text-ink-soft">{event.venue}</p>}
                        {event.note && <p className="mt-1.5 font-serif text-lg italic leading-snug text-muted">{event.note}</p>}
                        {directions && (
                          <a href={directions} target="_blank" rel="noopener noreferrer" className="link-line no-print mt-3 !text-[0.6875rem]">
                            <Icon name="pin" size={14} />
                            Directions
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          );
        })}
      </ol>

      {(service.dress_code || service.livestream_url) && (
        <Reveal className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {service.dress_code && (
            <p className="text-ink-soft">
              <span className="eyebrow mr-3">Dress</span>
              {service.dress_code}
            </p>
          )}
          {service.livestream_url && (
            <a href={service.livestream_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline no-print">
              <Icon name="video" size={16} />
              Watch Livestream
            </a>
          )}
        </Reveal>
      )}
    </div>

    {programme && (
      <Reveal as="figure" className="no-print lg:sticky lg:top-28 lg:self-start">
        <a
          href={programme.src}
          target="_blank"
          rel="noopener noreferrer"
          className="group block cursor-zoom-in overflow-hidden rounded-[2px] border border-line bg-paper shadow-soft"
          aria-label="Open the funeral programme at full size"
        >
          <Image
            src={programme.src}
            alt={programme.alt}
            width={programme.width}
            height={programme.height}
            sizes="(min-width: 1280px) 20rem, (min-width: 1024px) 17rem, (min-width: 640px) 24rem, 92vw"
            className="mx-auto h-auto w-full max-w-sm transition-transform duration-[1400ms] ease-calm group-hover:scale-[1.02] lg:max-w-none"
          />
        </a>
        <figcaption className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className="eyebrow">The funeral programme</span>
          <a href={programme.src} download="Emmanuel-Uvere-Okoro-funeral-programme.jpg" className="link-line !text-[0.6875rem]">
            <Icon name="download" size={14} />
            Download
          </a>
        </figcaption>
      </Reveal>
    )}
    </div>
  );
}

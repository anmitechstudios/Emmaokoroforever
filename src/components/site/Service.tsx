import type { ServiceInfo } from "@/lib/db/types";
import { fullDate } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/motion";

export function Service({ service }: { service: ServiceInfo }) {
  // Only offer a map once there is a real address to find — not a placeholder venue such as "To be announced".
  const place = service.map_query || (service.address ? [service.venue, service.address].filter(Boolean).join(", ") : "");
  const directions = place ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place)}` : null;
  const map = place ? `https://www.google.com/maps?q=${encodeURIComponent(place)}&output=embed` : null;

  return (
    <div className="mt-14 grid gap-12 lg:mt-20 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-6">
        <Reveal>
          {service.title && <p className="font-serif text-2xl italic text-accent">{service.title}</p>}
          {service.date && (
            <p className="mt-3 font-serif text-[clamp(2rem,4.2vw,3.5rem)] font-light leading-[1.05]">
              <time dateTime={service.date}>{fullDate(service.date)}</time>
            </p>
          )}
        </Reveal>

        <Reveal delay={0.1}>
          <dl className="mt-10 grid gap-x-10 gap-y-7 border-t border-line pt-8 sm:grid-cols-2">
            {service.time && (
              <div>
                <dt className="eyebrow">Time</dt>
                <dd className="mt-2 font-serif text-2xl">{service.time}</dd>
              </div>
            )}
            {service.venue && (
              <div>
                <dt className="eyebrow">Venue</dt>
                <dd className="mt-2">
                  <span className="font-serif text-2xl leading-tight">{service.venue}</span>
                  {service.address && <span className="mt-1 block text-[0.9375rem] text-muted">{service.address}</span>}
                </dd>
              </div>
            )}
            {service.dress_code && (
              <div className="sm:col-span-2">
                <dt className="eyebrow">Dress</dt>
                <dd className="mt-2 text-ink-soft">{service.dress_code}</dd>
              </div>
            )}
          </dl>
        </Reveal>

        {service.schedule.length > 0 && (
          <Reveal delay={0.15}>
            <h3 className="eyebrow mt-12 !font-sans">Order of the day</h3>
            <ol className="mt-4">
              {service.schedule.map((item) => (
                <li key={item.id} className="grid grid-cols-[6.5rem_1fr] gap-4 border-t border-line py-4 last:border-b">
                  <span className="pt-1 text-[0.8125rem] tabular-nums tracking-wide text-muted">{item.time}</span>
                  <span>
                    <span className="block font-serif text-xl leading-snug">{item.title}</span>
                    {item.note && <span className="block text-[0.875rem] text-muted">{item.note}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </Reveal>
        )}

        {service.notes && (
          <Reveal delay={0.2}>
            <p className="mt-8 max-w-lg font-serif text-xl italic leading-snug text-ink-soft">{service.notes}</p>
          </Reveal>
        )}

        <Reveal delay={0.25} className="no-print mt-10 flex flex-wrap gap-4">
          {directions && (
            <a href={directions} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              <Icon name="pin" size={16} />
              Get Directions
            </a>
          )}
          {service.livestream_url && (
            <a href={service.livestream_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              <Icon name="video" size={16} />
              Watch Livestream
            </a>
          )}
        </Reveal>
      </div>

      {map && (
        <Reveal delay={0.15} className="no-print lg:col-span-5 lg:col-start-8">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-line/50 lg:sticky lg:top-28">
            <iframe
              src={map}
              title={`Map showing ${service.venue || "the venue"}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 h-full w-full border-0 [filter:grayscale(1)_sepia(0.18)_contrast(0.92)]"
            />
          </div>
        </Reveal>
      )}
    </div>
  );
}

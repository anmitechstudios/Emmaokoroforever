import Image from "next/image";
import type { CSSProperties } from "react";
import type { Memorial } from "@/lib/db/types";
import { age, longDate } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { RevealImage } from "@/components/ui/motion";
import { TributeButton } from "./TributeDialog";

const delay = (seconds: number) => ({ "--delay": `${seconds}s` }) as CSSProperties;

export function Hero({ memorial, nextHref }: { memorial: Memorial; nextHref: string }) {
  const words = memorial.full_name.trim().split(/\s+/);
  const lines = words.length <= 3 ? words : [words.slice(0, -1).join(" "), words[words.length - 1]];

  return (
    <section className="relative flex min-h-svh flex-col" aria-labelledby="memorial-name">
      <div className="shell grid flex-1 content-center gap-x-10 gap-y-10 pb-16 pt-24 lg:grid-cols-12 lg:grid-rows-[auto_auto] lg:gap-y-10 lg:pb-24 lg:pt-28">
        <div className={`${memorial.hero_image_url ? "lg:col-span-7" : "lg:col-span-10"} lg:self-end`}>
          <p className="eyebrow rise flex items-center gap-4">
            <span className="h-px w-10 bg-accent" aria-hidden="true" />
            {memorial.epitaph}
          </p>

          <h1 id="memorial-name" className="mt-7 font-serif text-display font-light leading-[0.92] tracking-[-0.02em] lg:mt-8">
            {memorial.honorific && (
              <span className="rise mb-3 block text-2xl font-normal italic tracking-normal text-muted lg:mb-4 lg:text-3xl" style={delay(0.1)}>
                {memorial.honorific}
              </span>
            )}
            {lines.map((line, i) => (
              <span key={i} className="line-mask">
                <span className={`line-up ${i === lines.length - 1 ? "italic text-accent" : ""}`} style={delay(0.15 + i * 0.12)}>
                  {line}
                </span>{" "}
              </span>
            ))}
          </h1>

          <div className="rise" style={delay(0.75)}>
            <p className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] uppercase tracking-[0.2em] text-ink-soft lg:mt-8">
              <time dateTime={memorial.born_on}>{longDate(memorial.born_on)}</time>
              <span className="h-px w-6 bg-muted" aria-hidden="true" />
              <span className="sr-only">to</span>
              <time dateTime={memorial.died_on}>{longDate(memorial.died_on)}</time>
            </p>
            <p className="mt-2 text-[0.8125rem] tracking-wide text-muted">
              {[memorial.birthplace && `Born in ${memorial.birthplace}`, `Aged ${age(memorial.born_on, memorial.died_on)}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        {memorial.hero_image_url && (
        <div className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:self-center">
          <RevealImage immediate delay={0.2} parallax={30} className="arch mx-auto aspect-[4/5] w-full max-w-[24rem] lg:max-w-none">
            <Image
              src={memorial.hero_image_url}
              alt={memorial.hero_image_alt || `Portrait of ${memorial.full_name}`}
              fill
              priority
              sizes="(min-width: 1024px) 38vw, (min-width: 480px) 24rem, 92vw"
              className="object-cover"
            />
          </RevealImage>
        </div>
        )}

        <div className="lg:col-span-6 lg:self-start">
          {memorial.quote && (
            <figure className="rise" style={delay(0.95)}>
              <blockquote className="font-serif text-lede italic leading-snug text-ink-soft">“{memorial.quote}”</blockquote>
              {memorial.quote_source && <figcaption className="eyebrow mt-4">{memorial.quote_source}</figcaption>}
            </figure>
          )}
          <div className="rise no-print mt-9 flex flex-wrap items-center gap-x-8 gap-y-5" style={delay(1.1)}>
            <TributeButton>Leave a Tribute</TributeButton>
            <a href={nextHref} className="link-line">
              Read the story
            </a>
          </div>
        </div>
      </div>

      <a
        href={nextHref}
        className="rise no-print absolute bottom-0 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 pb-7 text-muted transition-colors duration-500 hover:text-ink lg:flex"
        style={delay(1.5)}
      >
        <span className="eyebrow !tracking-[0.3em]">Scroll</span>
        <Icon name="arrow-down" size={16} />
      </a>
    </section>
  );
}

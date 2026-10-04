import Image from "next/image";
import type { Memorial } from "@/lib/db/types";
import { paragraphs } from "@/lib/format";
import { Reveal, RevealImage } from "@/components/ui/motion";
import { SectionHeader } from "./SectionHeader";
import { TributeButton } from "./TributeDialog";

export function Story({ memorial, number }: { memorial: Memorial; number: string }) {
  const chapters = memorial.chapters.filter((c) => c.title || c.body);

  return (
    <section id="story" className="section" aria-label="Life story">
      <div className="shell">
        <SectionHeader number={number} eyebrow="The Story" title={<>The life of <em className="text-accent">{memorial.short_name}</em></>} />

        {memorial.story_intro && (
          <Reveal delay={0.1}>
            <p className="mt-12 max-w-4xl font-serif text-lede leading-[1.35] text-ink-soft lg:mt-16">{memorial.story_intro}</p>
          </Reveal>
        )}

        <div className="mt-20 space-y-24 lg:mt-32 lg:space-y-40">
          {chapters.map((chapter, index) => {
            const flip = index % 2 === 1;
            const body = paragraphs(chapter.body);
            return (
              <article key={chapter.id}>
                <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-8">
                  {chapter.image_url && (
                    <figure className={`lg:col-span-5 ${flip ? "lg:order-2 lg:col-start-8" : ""}`}>
                      <RevealImage className="aspect-[4/5] rounded-[2px]">
                        <Image
                          src={chapter.image_url}
                          alt={chapter.image_caption || chapter.title}
                          fill
                          sizes="(min-width: 1024px) 36vw, 92vw"
                          // Anchor to the top: in photographs of people, faces sit high in the frame.
                          className="object-cover object-top"
                        />
                      </RevealImage>
                      {chapter.image_caption && (
                        <figcaption className="mt-4 flex items-baseline gap-3 text-[0.8125rem] text-muted">
                          <span className="h-px w-6 shrink-0 translate-y-[-0.25em] bg-line" aria-hidden="true" />
                          {chapter.image_caption}
                        </figcaption>
                      )}
                    </figure>
                  )}

                  <div
                    className={
                      chapter.image_url
                        ? `lg:col-span-6 lg:pt-10 ${flip ? "lg:order-1 lg:col-start-1" : "lg:col-start-7"}`
                        : "lg:col-span-8 lg:col-start-3"
                    }
                  >
                    <Reveal>
                      {chapter.kicker && <p className="eyebrow">{chapter.kicker}</p>}
                      <h3 className="mt-5 text-heading leading-[1.08]">{chapter.title}</h3>
                    </Reveal>
                    <div className="mt-7 space-y-5 text-ink-soft">
                      {body.map((paragraph, i) => (
                        <Reveal key={i} delay={0.05 * i} as="p" className={index === 0 && i === 0 ? "dropcap" : undefined}>
                          {paragraph}
                        </Reveal>
                      ))}
                    </div>
                  </div>
                </div>

                {chapter.pull_quote && (
                  <Reveal className="mx-auto mt-20 max-w-4xl text-center lg:mt-32">
                    <span className="mx-auto block h-12 w-px bg-accent" aria-hidden="true" />
                    <blockquote className="mt-8 font-serif text-[clamp(1.875rem,4.4vw,3.5rem)] font-light italic leading-[1.15]">
                      “{chapter.pull_quote}”
                    </blockquote>
                  </Reveal>
                )}
              </article>
            );
          })}
        </div>

        <Reveal className="no-print mt-20 flex flex-col items-center gap-6 border-t border-line pt-14 text-center lg:mt-32">
          <p className="max-w-md font-serif text-2xl italic text-ink-soft">
            Every life is remembered in pieces. Which piece do you carry?
          </p>
          <TributeButton mode="memory" className="btn btn-outline">
            Share a Memory
          </TributeButton>
        </Reveal>
      </div>
    </section>
  );
}

import Link from "next/link";
import type { Memorial } from "@/lib/db/types";
import { lifespan, siteUrl } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/motion";
import { PrintButton, ShareButton } from "./Share";
import { TributeButton } from "./TributeDialog";

export function shareCopy(memorial: Memorial) {
  return {
    url: siteUrl(),
    title: memorial.settings.share_title || `${memorial.epitaph} · ${memorial.full_name}`,
    text:
      memorial.settings.share_description ||
      `${memorial.epitaph}: ${memorial.full_name}, ${lifespan(memorial.born_on, memorial.died_on)}. Read the story, see the photographs and leave a tribute.`,
  };
}

/** The last room: a closing word from the family and one more invitation to write. */
export function Closing({ memorial }: { memorial: Memorial }) {
  const share = shareCopy(memorial);
  return (
    <section className="section border-t border-line" aria-label="Closing message">
      <div className="shell text-center">
        <Reveal>
          <span className="mx-auto block h-16 w-px bg-accent" aria-hidden="true" />
        </Reveal>
        {memorial.closing_message && (
          <Reveal delay={0.1}>
            <p className="mx-auto mt-10 max-w-4xl font-serif text-[clamp(1.75rem,3.6vw,3rem)] font-light leading-[1.22]">
              {memorial.closing_message}
            </p>
          </Reveal>
        )}
        {memorial.closing_message && (
          <Reveal delay={0.2}>
            <p className="eyebrow mt-8">{memorial.settings.contact_name || "The family"}</p>
          </Reveal>
        )}

        <Reveal delay={0.3} className="no-print mt-14 flex flex-col items-center gap-10">
          <TributeButton>Leave a Message</TributeButton>
          <div className="flex flex-wrap items-center justify-center gap-x-9 gap-y-4 text-muted">
            <ShareButton {...share}>
              <Icon name="share" size={15} />
              Share this memorial
            </ShareButton>
            <a href="/memorial.pdf" className="link-line" download>
              <Icon name="download" size={15} />
              Memorial booklet (PDF)
            </a>
            <PrintButton>
              <Icon name="print" size={15} />
              Print this page
            </PrintButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer({ memorial }: { memorial: Memorial }) {
  const share = shareCopy(memorial);
  return (
    <footer className="border-t border-line bg-surface">
      <div className="shell py-20 text-center lg:py-28">
        <p className="eyebrow">Forever Remembered</p>
        <p className="mt-6 font-serif text-4xl font-light lg:text-5xl">{memorial.full_name}</p>
        <p className="mt-3 text-[0.8125rem] uppercase tracking-[0.24em] text-muted">{lifespan(memorial.born_on, memorial.died_on)}</p>
        <p className="mx-auto mt-10 max-w-sm font-serif text-xl italic leading-relaxed text-ink-soft">
          “Those we love don't go away,
          <br />
          they walk beside us every day.”
        </p>

        <nav aria-label="Footer" className="no-print mt-14 flex flex-wrap items-center justify-center gap-x-9 gap-y-4 text-ink-soft">
          <ShareButton {...share}>Share memorial</ShareButton>
          <TributeButton className="link-line">Leave tribute</TributeButton>
          <Link href="/privacy#contact" className="link-line">
            Contact family
          </Link>
          <Link href="/privacy" className="link-line">
            Privacy
          </Link>
        </nav>

        <p className="no-print mt-14 text-xs text-muted">
          <Link href="/admin" className="underline-offset-4 hover:underline">
            Family sign-in
          </Link>
        </p>
        <p className="mt-3 text-xs text-muted">Site by Michael Osayame-Ebohon</p>
      </div>
    </footer>
  );
}

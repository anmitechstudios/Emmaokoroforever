import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { getMemorial } from "@/lib/queries";

export const revalidate = 300;
export const metadata: Metadata = { title: "Privacy & contact" };

export default async function Privacy() {
  const memorial = await getMemorial();
  const { contact_name, contact_email, contact_phone } = memorial.settings;

  return (
    <main id="content" className="shell max-w-3xl pb-28">
      <div className="flex h-16 items-center lg:h-20">
        <Link href="/" className="link-line !bg-none text-muted">
          <Icon name="arrow-left" size={16} />
          Back to the memorial
        </Link>
      </div>

      <p className="eyebrow mt-12">Privacy &amp; contact</p>
      <h1 className="mt-6 text-title font-light leading-[1.02]">
        A private place, <em className="text-accent">kept with care</em>
      </h1>
      <p className="mt-8 font-serif text-lede leading-snug text-ink-soft">
        This memorial was made by the family of {memorial.full_name}. It carries no advertising and no tracking, and
        nothing you write here is used for anything other than remembering.
      </p>

      <div className="mt-14 space-y-12 border-t border-line pt-12 [&_h2]:font-serif [&_h2]:text-3xl [&_p]:mt-3 [&_p]:text-ink-soft">
        <section>
          <h2>What you share</h2>
          <p>
            When you leave a tribute, a memory, a guestbook entry or a candle, we keep your name and your words so they
            can be shown on this page. A photograph, if you add one, is stored with your tribute; any location data
            inside the image file is removed before it is saved.
          </p>
        </section>
        <section>
          <h2>Your email address</h2>
          <p>
            Email is always optional. If you give it, only the family can see it. It is never displayed on the
            memorial, never shared, and never added to a mailing list.
          </p>
        </section>
        <section>
          <h2>What appears, and when</h2>
          <p>
            Tributes appear on the memorial as soon as they are sent. Memories and names added to candles are read by a
            member of the family first. The family can remove anything, and visitors can report a tribute. One that is
            reported several times is hidden until the family has looked at it again.
          </p>
        </section>
        <section>
          <h2>What we store on your device</h2>
          <p>
            Your browser remembers which tributes you have sent a heart to and whether you have lit a candle, so the
            page can show that when you return. This stays on your device. We also keep a one-way, anonymised
            fingerprint of your network address for a short time, solely to prevent spam.
          </p>
        </section>
        <section id="contact" className="scroll-mt-24">
          <h2>Contact the family</h2>
          <p>
            To change or remove something you have written, to share photographs privately, or simply to reach the
            family, please write to {contact_name || "the family"}.
          </p>
          {(contact_email || contact_phone) && (
            <ul className="mt-6 space-y-2">
              {contact_email && (
                <li>
                  <a href={`mailto:${contact_email}`} className="link-line !normal-case !tracking-normal !text-base">
                    <Icon name="mail" size={17} />
                    {contact_email}
                  </a>
                </li>
              )}
              {contact_phone && <li className="text-ink-soft">{contact_phone}</li>}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

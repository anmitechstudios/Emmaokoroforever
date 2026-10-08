import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TributeButton } from "@/components/site/TributeDialog";
import { Icon } from "@/components/ui/Icon";
import { lifespan, longDate } from "@/lib/format";
import { getMemorial, getTribute } from "@/lib/queries";

// A single tribute on its own page — the address used when someone shares one.
export const revalidate = 300;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ id }, memorial] = await Promise.all([params, getMemorial()]);
  const tribute = await getTribute(id);
  if (!tribute) return { title: "Tribute not found" };
  const description = tribute.message.length > 180 ? `${tribute.message.slice(0, 177)}…` : tribute.message;
  return {
    title: `A tribute from ${tribute.name}`,
    description,
    openGraph: { title: `A tribute to ${memorial.full_name}, from ${tribute.name}`, description },
  };
}

export default async function TributePage({ params }: Props) {
  const [{ id }, memorial] = await Promise.all([params, getMemorial()]);
  const tribute = await getTribute(id);
  if (!tribute) notFound();

  return (
    <main id="content" className="flex min-h-svh flex-col">
      <div className="shell flex h-16 items-center lg:h-20">
        <Link href="/#tributes" className="link-line !bg-none text-muted">
          <Icon name="arrow-left" size={16} />
          All tributes
        </Link>
      </div>

      <article className="shell flex flex-1 flex-col items-center justify-center py-16 text-center lg:py-24">
        <p className="eyebrow rise">
          {memorial.epitaph} · {memorial.full_name} · {lifespan(memorial.born_on, memorial.died_on)}
        </p>
        {tribute.photo_url && (
          <a
            href={tribute.photo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rise mt-12 block w-full max-w-xl cursor-zoom-in overflow-hidden rounded-[2px]"
            style={{ ["--delay" as string]: "0.1s" }}
            aria-label={`Open the photograph shared by ${tribute.name} at full size`}
          >
            <Image
              src={tribute.photo_url}
              alt={`Photograph shared by ${tribute.name}`}
              width={1200}
              height={900}
              sizes="(min-width: 640px) 36rem, 92vw"
              className="h-auto max-h-[70vh] w-full object-contain"
              priority
            />
          </a>
        )}
        <span className="rise mt-12 block h-10 font-serif text-8xl leading-none text-accent" aria-hidden="true" style={{ ["--delay" as string]: "0.15s" }}>
          “
        </span>
        <blockquote
          className={`rise mt-6 max-w-3xl whitespace-pre-line font-serif font-light leading-[1.3] ${
            tribute.message.length > 400 ? "text-2xl lg:text-[1.75rem]" : "text-[clamp(1.75rem,3.6vw,2.75rem)]"
          }`}
          style={{ ["--delay" as string]: "0.2s" }}
        >
          {tribute.message}
        </blockquote>
        <footer className="rise mt-10" style={{ ["--delay" as string]: "0.35s" }}>
          <p className="font-medium">{tribute.name}</p>
          <p className="mt-1 text-[0.875rem] text-muted">
            {tribute.relationship && <span className="font-serif text-lg italic">{tribute.relationship} · </span>}
            <time dateTime={tribute.created_at}>{longDate(tribute.created_at)}</time>
          </p>
        </footer>

        <div className="rise mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-5" style={{ ["--delay" as string]: "0.5s" }}>
          <TributeButton>Leave a Tribute</TributeButton>
          <Link href="/" className="link-line">
            Visit the memorial
          </Link>
        </div>
      </article>
    </main>
  );
}

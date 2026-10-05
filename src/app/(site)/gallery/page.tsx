import type { Metadata } from "next";
import Link from "next/link";
import { Gallery } from "@/components/site/Gallery";
import { TributeButton } from "@/components/site/TributeDialog";
import { Icon } from "@/components/ui/Icon";
import { getGallery } from "@/lib/queries";

// The full album. The home page shows only the first few photographs.
export const revalidate = 300;
export const metadata: Metadata = { title: "Photographs" };

export default async function GalleryPage() {
  const { memorial, images } = await getGallery();

  return (
    <main id="content" className="shell pb-28">
      <div className="flex h-16 items-center lg:h-20">
        <Link href="/#gallery" className="link-line !bg-none text-muted">
          <Icon name="arrow-left" size={16} />
          Back to the memorial
        </Link>
      </div>

      <p className="eyebrow rise mt-10">
        {memorial.full_name} · {images.length} {images.length === 1 ? "photograph" : "photographs"}
      </p>
      <h1 className="rise mt-6 text-title font-light leading-[1.02]" style={{ ["--delay" as string]: "0.1s" }}>
        An album of <em className="text-accent">moments</em>
      </h1>

      {images.length > 0 ? (
        <Gallery images={images} />
      ) : (
        <p className="py-24 text-center font-serif text-2xl italic text-muted">Photographs will be added here soon.</p>
      )}

      <div className="no-print mt-16 flex flex-col items-center gap-6 border-t border-line pt-14 text-center">
        <p className="max-w-md font-serif text-2xl italic text-ink-soft">Do you have a photograph or a story that belongs here?</p>
        <TributeButton className="btn btn-outline">Add Your Memory</TributeButton>
      </div>
    </main>
  );
}

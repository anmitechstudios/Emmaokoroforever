import type { ReactNode } from "react";
import { Candle } from "@/components/site/Candle";
import { Family } from "@/components/site/Family";
import { Favorites } from "@/components/site/Favorites";
import { Closing, Footer } from "@/components/site/Footer";
import { Gallery } from "@/components/site/Gallery";
// import { Guestbook } from "@/components/site/Guestbook";
import { Header, type NavLink } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
// import { Media } from "@/components/site/Media";
import { MemoryWall } from "@/components/site/MemoryWall";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Service } from "@/components/site/Service";
import { Story } from "@/components/site/Story";
// import { Timeline } from "@/components/site/Timeline";
import { TributeButton } from "@/components/site/TributeDialog";
import { Tributes } from "@/components/site/Tributes";
import { Reveal } from "@/components/ui/motion";
import type { SectionKey } from "@/lib/db/types";
import { getHome } from "@/lib/queries";

// Rendered ahead of time and refreshed in the background; admin changes and
// approvals revalidate it immediately.
export const revalidate = 300;

const accent = (text: string) => <em className="text-accent">{text}</em>;

export default async function Home() {
  const data = await getHome();
  const { memorial, service } = data;
  const on = memorial.settings.sections;
  const name = memorial.short_name;

  // The journey, in order. A room is skipped when it is switched off or empty.
  const rooms: { key: SectionKey; nav?: string; render: (number: string) => ReactNode }[] = [
    {
      key: "story",
      nav: "Story",
      render: (number) => memorial.chapters.length > 0 && <Story memorial={memorial} number={number} />,
    },
    // "The Years" timeline — commented out for now. Restore this block and its import above to bring it back.
    // {
    //   key: "timeline",
    //   nav: "Timeline",
    //   render: (number) =>
    //     data.timeline.length > 0 && (
    //       <section id="timeline" className="section border-y border-line bg-surface" aria-label="Life timeline">
    //         <div className="shell">
    //           <SectionHeader number={number} eyebrow="The Years" title={<>A life in {accent("years")}</>} align="center" />
    //           <div className="mx-auto max-w-5xl">
    //             <Timeline events={data.timeline} />
    //           </div>
    //         </div>
    //       </section>
    //     ),
    // },
    {
      key: "memories",
      render: (number) => (
        <section id="memories" className="section" aria-label="Shared memories">
          <div className="shell">
            <SectionHeader
              number={number}
              eyebrow="Memories"
              title={<>What's one thing you'll always {accent("remember?")}</>}
              action={
                <TributeButton mode="memory" className="btn btn-outline">
                  Share a Memory
                </TributeButton>
              }
            >
              <p>The small things: a habit, a phrase, a laugh. Add yours to the wall.</p>
            </SectionHeader>
            {data.memories.length > 0 && <MemoryWall memories={data.memories} />}
          </div>
        </section>
      ),
    },
    {
      key: "gallery",
      nav: "Gallery",
      render: (number) =>
        data.gallery.length > 0 && (
          <section id="gallery" className="section border-t border-line" aria-label="Photographs">
            <div className="shell">
              <SectionHeader number={number} eyebrow="Photographs" title={<>An album of {accent("moments")}</>}>
                <p>A few photographs from the album. Select any one to see it in full.</p>
              </SectionHeader>
              <Gallery images={data.gallery} preview={9} />
              <Reveal className="no-print mt-12 flex flex-col items-center gap-6 text-center lg:mt-20">
                <p className="max-w-md font-serif text-2xl italic text-ink-soft">
                  Do you have a photograph or a story that belongs here?
                </p>
                <TributeButton className="btn btn-outline">Add Your Memory</TributeButton>
              </Reveal>
            </div>
          </section>
        ),
    },
    {
      key: "favorites",
      render: (number) =>
        memorial.favorites.length > 0 && (
          <section id="favourites" className="section border-y border-line bg-surface" aria-label="Favourite things">
            <div className="shell">
              <SectionHeader number={number} eyebrow="Favourite Things" title={<>The things {name} {accent("loved")}</>} />
              <Favorites favorites={memorial.favorites} />
            </div>
          </section>
        ),
    },
    // Recordings ("Voice & film") — commented out for now. Restore this block and
    // the Media import above to bring the section back.
    // {
    //   key: "media",
    //   render: (number) =>
    //     data.media.length > 0 && (
    //       <section id="recordings" className="section" aria-label="Video and audio">
    //         <div className="shell">
    //           <SectionHeader number={number} eyebrow="Recordings" title={<>Voice {accent("&")} film</>} />
    //           <Media items={data.media} />
    //         </div>
    //       </section>
    //     ),
    // },
    {
      key: "tributes",
      nav: "Tributes",
      render: (number) => (
        <section id="tributes" className="section border-y border-line bg-surface" aria-label="Tributes and condolences">
          <div className="shell max-w-[76rem]">
            <SectionHeader
              number={number}
              eyebrow="Tributes & Condolences"
              title={<>Words of {accent("love")}</>}
              action={<TributeButton>Leave a Tribute</TributeButton>}
            >
              <p>Share a memory, a message, a prayer, or words of comfort.</p>
            </SectionHeader>
            <Tributes initial={data.tributes.tributes} total={data.tributes.total} />
          </div>
        </section>
      ),
    },
    {
      key: "family",
      render: (number) =>
        data.family.length > 0 && (
          <section id="family" className="section" aria-label="Family">
            <div className="shell">
              <SectionHeader number={number} eyebrow="Family" title={<>Lovingly {accent("survived by")}</>} />
              <Family members={data.family} />
            </div>
          </section>
        ),
    },
    {
      key: "service",
      nav: "Service",
      render: (number) =>
        service &&
        (service.date || service.venue) && (
          <section id="service" className="section border-y border-line bg-surface" aria-label="Service information">
            <div className="shell">
              <SectionHeader number={number} eyebrow="The Service" title={<>Join us in {accent("remembrance")}</>} />
              <Service service={service} />
            </div>
          </section>
        ),
    },
    {
      key: "candles",
      render: () => <Candle count={data.candles.count} names={data.candles.names} shortName={name} />,
    },
    // Guestbook — commented out for now. Restore this block and its import above to bring it back.
    // {
    //   key: "guestbook",
    //   nav: "Guestbook",
    //   render: (number) => (
    //     <section id="guestbook" className="section" aria-label="Guestbook">
    //       <div className="shell">
    //         <SectionHeader number={number} eyebrow="Guestbook" title={<>Sign the {accent("book")}</>} align="center" />
    //         <Guestbook entries={data.guestbook} />
    //       </div>
    //     </section>
    //   ),
    // },
  ];

  let count = 0;
  const rendered = rooms
    .filter((room) => on[room.key] !== false)
    .map((room) => {
      const node = room.render(String(count + 1).padStart(2, "0"));
      if (node && room.key !== "candles") count += 1;
      return { ...room, node };
    })
    .filter((room) => room.node);

  const ids: Record<string, string> = { favorites: "favourites", media: "recordings", candles: "candle" };
  const links: NavLink[] = rendered.filter((room) => room.nav).map((room) => ({ href: `#${ids[room.key] ?? room.key}`, label: room.nav! }));
  const first = rendered[0] ? `#${ids[rendered[0].key] ?? rendered[0].key}` : "#content";

  return (
    <>
      <Header name={memorial.full_name.split(/\s+/).filter((_, i, all) => i === 0 || i === all.length - 1).join(" ")} links={links} />
      <main id="content">
        <Hero memorial={memorial} nextHref={first} />
        {rendered.map((room) => (
          <div key={room.key}>{room.node}</div>
        ))}
        <Closing memorial={memorial} />
      </main>
      <Footer memorial={memorial} />
    </>
  );
}

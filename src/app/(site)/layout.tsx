import type { Metadata, Viewport } from "next";
import type { CSSProperties, ReactNode } from "react";
import { fontVariables } from "@/app/fonts";
import "@/app/globals.css";
import { Providers } from "@/components/site/Providers";
import { shareCopy } from "@/components/site/Footer";
import { lifespan, siteUrl } from "@/lib/format";
import { getMemorial } from "@/lib/queries";

const PAPER = { ivory: "#f6f2ea", stone: "#eeeeea", evening: "#1b1917" } as const;

export async function generateMetadata(): Promise<Metadata> {
  const memorial = await getMemorial();
  const share = shareCopy(memorial);
  const description =
    memorial.settings.share_description ||
    `${memorial.epitaph} · ${lifespan(memorial.born_on, memorial.died_on)}. ${memorial.story_intro}`.slice(0, 200);
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: share.title, template: `%s — ${memorial.full_name}` },
    description,
    openGraph: {
      type: "website",
      url: "/",
      siteName: memorial.full_name,
      title: share.title,
      description: `${lifespan(memorial.born_on, memorial.died_on)} · ${memorial.quote || description}`.slice(0, 200),
    },
    twitter: { card: "summary_large_image", title: share.title },
    formatDetection: { telephone: false },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const memorial = await getMemorial();
  return { themeColor: PAPER[memorial.settings.theme] ?? PAPER.ivory };
}

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const memorial = await getMemorial();
  const { theme, accent } = memorial.settings;
  return (
    <html lang="en" data-scroll-behavior="smooth" data-theme={theme} style={{ "--accent": accent } as CSSProperties} className={fontVariables}>
      <body>
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-sm focus:text-paper"
        >
          Skip to content
        </a>
        <Providers shortName={memorial.short_name}>{children}</Providers>
      </body>
    </html>
  );
}

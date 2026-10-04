import type { Favorite } from "@/lib/db/types";
import { Reveal } from "@/components/ui/motion";

/** The small loves of a life — set like entries in a commonplace book. */
export function Favorites({ favorites }: { favorites: Favorite[] }) {
  return (
    <dl className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2 lg:mt-20 lg:grid-cols-6 lg:gap-x-16 lg:gap-y-16">
      {favorites.map((favorite, i) => {
        const long = favorite.value.length > 34;
        return (
          <Reveal
            key={favorite.id}
            delay={(i % 3) * 0.08}
            className={`border-t border-line pt-6 ${long ? "sm:col-span-2 lg:col-span-4" : "lg:col-span-2"}`}
          >
            <dt className="eyebrow">{favorite.label}</dt>
            <dd className="mt-4">
              <p
                className={`font-serif leading-[1.12] ${
                  long ? "text-[clamp(1.75rem,3.4vw,2.75rem)] font-light italic" : "text-[clamp(1.75rem,3vw,2.5rem)]"
                }`}
              >
                {long ? `“${favorite.value}”` : favorite.value}
              </p>
              {favorite.note && <p className="mt-3 max-w-md text-[0.9375rem] text-muted">{favorite.note}</p>}
            </dd>
          </Reveal>
        );
      })}
    </dl>
  );
}

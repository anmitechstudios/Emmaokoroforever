"use client";

import { useState } from "react";
import type { PublicMemory } from "@/lib/db/types";
import { Reveal } from "@/components/ui/motion";

const FIRST = 9;

/** Short, specific recollections set at different scales — a wall of small things. */
export function MemoryWall({ memories }: { memories: PublicMemory[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? memories : memories.slice(0, FIRST);

  return (
    <>
      <ul className="mt-14 columns-1 gap-x-12 sm:columns-2 lg:mt-20 lg:columns-3 lg:gap-x-16">
        {shown.map((memory, i) => {
          const short = memory.body.length < 60;
          return (
            <Reveal as="li" key={memory.id} delay={(i % 3) * 0.08} className="mb-10 break-inside-avoid border-t border-line pt-6 lg:mb-12">
              <figure>
                <blockquote
                  className={`font-serif leading-snug ${short ? "text-[1.75rem] italic lg:text-4xl" : "text-xl lg:text-[1.375rem]"}`}
                >
                  {memory.body}
                </blockquote>
                <figcaption className="mt-4 text-[0.8125rem] text-muted">
                  <span className="font-medium text-ink-soft">{memory.name}</span>
                  {memory.relationship && <span> · {memory.relationship}</span>}
                </figcaption>
              </figure>
            </Reveal>
          );
        })}
      </ul>
      {!all && memories.length > FIRST && (
        <div className="no-print mt-4 text-center">
          <button type="button" className="link-line" onClick={() => setAll(true)}>
            Show all {memories.length} memories
          </button>
        </div>
      )}
    </>
  );
}

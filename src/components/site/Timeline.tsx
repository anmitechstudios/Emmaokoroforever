"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { useRef } from "react";
import type { TimelineEvent } from "@/lib/db/types";
import { EASE } from "@/components/ui/motion";

/** A vertical line that draws itself as the visitor reads down through the years. */
export function Timeline({ events }: { events: TimelineEvent[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 28, restDelta: 0.001 });

  return (
    <ol ref={ref} className="relative mt-16 lg:mt-24">
      <span className="absolute bottom-0 left-[5px] top-2 w-px bg-line lg:left-1/2" aria-hidden="true" />
      <motion.span
        data-reveal
        className="absolute bottom-0 left-[5px] top-2 w-px origin-top bg-accent lg:left-1/2"
        style={{ scaleY: progress }}
        aria-hidden="true"
      />

      {events.map((event, index) => {
        const left = index % 2 === 0;
        return (
          <li key={event.id} className="relative grid pb-14 pl-10 last:pb-0 lg:grid-cols-2 lg:gap-x-24 lg:pb-20 lg:pl-0">
            <motion.span
              data-reveal
              className="absolute left-0 top-[0.9rem] size-[11px] rounded-full border border-accent bg-paper lg:left-1/2 lg:top-5 lg:-translate-x-[5px]"
              initial={{ scale: 0.4, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: "0px 0px -30% 0px" }}
              transition={{ duration: 0.7, ease: EASE }}
              aria-hidden="true"
            />
            <motion.div
              data-reveal
              className={left ? "lg:col-start-1 lg:text-right" : "lg:col-start-2"}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -25% 0px" }}
              transition={{ duration: 0.9, ease: EASE }}
            >
              <p className="font-serif text-5xl font-light leading-none lining-nums tabular-nums text-accent lg:text-7xl">{event.year}</p>
              <h3 className="mt-4 font-serif text-2xl lg:text-[1.75rem]">{event.title}</h3>
              {event.description && (
                <p className={`mt-2 max-w-md text-[0.9375rem] text-muted ${left ? "lg:ml-auto" : ""}`}>{event.description}</p>
              )}
            </motion.div>
          </li>
        );
      })}
    </ol>
  );
}

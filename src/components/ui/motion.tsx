"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type CSSProperties, type ReactNode } from "react";

// The animation system. One easing curve, long durations, and every reveal
// plays once. `MotionConfig reducedMotion="user"` (see Providers) removes
// movement for visitors who ask for that, leaving only gentle fades.

export const EASE = [0.22, 1, 0.36, 1] as const;
export const DURATION = { quick: 0.5, base: 0.9, slow: 1.4 } as const;
const VIEWPORT = { once: true, margin: "0px 0px -12% 0px" } as const;

/** Fades content up into place as it enters the viewport. */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "article" | "figure" | "section" | "p" | "span";
}) {
  const Tag = motion[as];
  return (
    <Tag
      data-reveal
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: DURATION.base, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}

/**
 * An image frame that uncovers from the bottom while the picture inside
 * settles from a slight zoom, then drifts a few pixels against the scroll.
 *
 * `immediate` is for images above the fold: the reveal runs as a CSS animation
 * so it starts before JavaScript loads and never delays the first paint.
 */
export function RevealImage({
  children,
  className,
  parallax = 24,
  immediate = false,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  parallax?: number;
  immediate?: boolean;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-parallax, parallax]);
  const drift = reduce || !parallax ? undefined : { y };

  if (immediate) {
    return (
      <div ref={ref} className={`unmask relative overflow-hidden ${className ?? ""}`} style={{ "--delay": `${delay}s` } as CSSProperties}>
        <motion.div className="settle absolute inset-x-0 -inset-y-[6%]" style={{ ...drift, "--delay": `${delay}s` } as never}>
          {children}
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      data-reveal
      className={`relative overflow-hidden ${className ?? ""}`}
      initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={VIEWPORT}
      transition={{ duration: DURATION.slow, ease: EASE, delay }}
    >
      <motion.div
        className="absolute inset-x-0 -inset-y-[6%]"
        style={drift}
        initial={{ scale: 1.12 }}
        whileInView={{ scale: 1 }}
        viewport={VIEWPORT}
        transition={{ duration: DURATION.slow * 1.3, ease: EASE, delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

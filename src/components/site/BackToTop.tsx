"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

/** A quiet button that appears once the visitor has scrolled a long way down. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      // Smoothness comes from `scroll-behavior` on <html>, which is switched off for reduced motion.
      onClick={() => window.scrollTo({ top: 0 })}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      className={`no-print fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] right-4 z-30 grid size-12 place-items-center rounded-full border border-line bg-paper/90 text-ink shadow-soft backdrop-blur-md transition-[opacity,translate,background-color,color] duration-500 ease-calm hover:bg-ink hover:text-paper sm:right-6 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <Icon name="arrow-up" />
    </button>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { TributeButton, useTributeDialog } from "./TributeDialog";

export type NavLink = { href: string; label: string };

export function Header({ name, links }: { name: string; links: NavLink[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const openTribute = useTributeDialog();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (menu && !el.open) el.showModal();
    if (!menu && el.open) el.close();
  }, [menu]);

  return (
    <header
      className={`no-print fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-700 ease-calm ${
        scrolled ? "border-b border-line bg-paper/90 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <div className="shell flex h-16 items-center justify-between gap-6 lg:h-20">
        <Link href="/" className="font-serif text-xl tracking-wide lg:text-[1.375rem]" aria-label={`${name} — memorial home`}>
          {name}
        </Link>

        <nav aria-label="Sections" className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-muted transition-colors duration-500 hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <TributeButton className="btn btn-primary btn-sm hidden sm:inline-flex">Leave a Tribute</TributeButton>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full lg:hidden"
            aria-label="Open menu"
            aria-haspopup="dialog"
            onClick={() => setMenu(true)}
          >
            <Icon name="menu" size={22} />
          </button>
        </div>
      </div>

      <dialog ref={dialog} className="sheet sheet-full" aria-label="Menu" onClose={() => setMenu(false)}>
        <div className="flex h-full flex-col bg-paper text-ink">
          <div className="shell flex h-16 shrink-0 items-center justify-between">
            <span className="font-serif text-xl tracking-wide">{name}</span>
            <button type="button" className="grid size-11 place-items-center rounded-full" aria-label="Close menu" onClick={() => setMenu(false)}>
              <Icon name="close" size={22} />
            </button>
          </div>
          <nav aria-label="Sections" className="shell flex flex-1 flex-col justify-center gap-1 overflow-y-auto py-8">
            {links.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenu(false)}
                className="flex items-baseline gap-5 border-b border-line py-4 font-serif text-4xl font-light"
              >
                <span className="font-sans text-[0.6875rem] tabular-nums tracking-[0.2em] text-accent">{String(i + 1).padStart(2, "0")}</span>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="shell shrink-0 pb-10">
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={() => {
                setMenu(false);
                openTribute("tribute");
              }}
            >
              Leave a Tribute
            </button>
          </div>
        </div>
      </dialog>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type AdminNavGroup = { label: string; links: { href: string; label: string; badge?: number }[] };

export function AdminNav({ groups }: { groups: AdminNavGroup[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Dashboard" className="flex gap-6 overflow-x-auto px-5 pb-3 scrollbar-none lg:block lg:space-y-7 lg:overflow-visible lg:px-0 lg:pb-0">
      {groups.map((group) => (
        <div key={group.label} className="flex shrink-0 items-center gap-1 lg:block">
          <p className="eyebrow hidden px-3 lg:block">{group.label}</p>
          <ul className="flex gap-1 lg:mt-2 lg:block lg:space-y-0.5">
            {group.links.map((link) => {
              const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between gap-3 whitespace-nowrap rounded px-3 py-1.5 text-sm transition-colors ${
                      active ? "bg-ink text-paper" : "text-ink-soft hover:bg-line/50"
                    }`}
                  >
                    {link.label}
                    {link.badge ? (
                      <span className={`rounded-full px-1.5 text-xs font-medium tabular-nums ${active ? "bg-paper/20" : "bg-[#b98a3c]/20 text-[#7d5a1c]"}`}>
                        {link.badge}
                        <span className="sr-only"> waiting for review</span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminPage({ title, intro, children, aside }: { title: string; intro?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 lg:px-10 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-light lg:text-5xl">{title}</h1>
          {intro && <p className="mt-2 max-w-xl text-muted">{intro}</p>}
        </div>
        {aside}
      </div>
      <div className="mt-8 space-y-8">{children}</div>
    </div>
  );
}

export function Panel({ title, hint, children }: { title?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-7">
      {title && <h2 className="font-serif text-2xl">{title}</h2>}
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className={title || hint ? "mt-5" : ""}>{children}</div>
    </section>
  );
}

export function Input({
  label,
  name,
  hint,
  className,
  ...props
}: { label: string; name: string; hint?: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label htmlFor={props.id ?? name} className="field-label">{label}</label>
      <input id={name} name={name} className="input" {...props} />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Area({
  label,
  name,
  hint,
  className,
  ...props
}: { label: string; name: string; hint?: string; className?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={className}>
      <label htmlFor={props.id ?? name} className="field-label">{label}</label>
      <textarea id={name} name={name} className="input" rows={3} {...props} />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

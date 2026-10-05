"use client";

import { useEffect, useRef, useState } from "react";
import { signGuestbook, type SubmitState } from "@/lib/actions/public";
import { useSubmit } from "@/lib/client";
import type { PublicGuestbookEntry } from "@/lib/db/types";
import { Field, Honeypot } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/motion";

const PER_PAGE = 5;

/** An open book: the left page is for signing, the right for reading. */
export function Guestbook({ entries }: { entries: PublicGuestbookEntry[] }) {
  const [page, setPage] = useState(0);
  const [signed, setSigned] = useState<{ name: string; location: string; message: string } | null>(null);
  const openedAt = useRef(0);
  const pages = Math.max(1, Math.ceil(entries.length / PER_PAGE));
  const shown = entries.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  const { state, pending, onSubmit } = useSubmit(async (form: FormData): Promise<SubmitState> => {
    form.set("elapsed", String(Date.now() - openedAt.current));
    try {
      const result = await signGuestbook(null, form);
      if (result?.ok) {
        setSigned({
          name: String(form.get("name")),
          location: String(form.get("location") ?? ""),
          message: String(form.get("message")),
        });
      }
      return result;
    } catch {
      return { ok: false, message: "Something went wrong. Please try again." };
    }
  });
  const errors = (state && !state.ok && state.errors) || {};

  return (
    <Reveal className="mt-14 lg:mt-20">
      <div className="relative mx-auto grid max-w-6xl rounded-[3px] border border-line bg-surface shadow-soft lg:grid-cols-2">
        <span className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-16 -translate-x-1/2 bg-gradient-to-r from-transparent via-ink/[0.045] to-transparent lg:block" aria-hidden="true" />

        {/* Left page — sign */}
        <div className="no-print border-b border-line p-7 sm:p-10 lg:border-b-0 lg:border-r lg:p-14">
          {signed ? (
            <div role="status">
              <p className="eyebrow">Signed</p>
              <p className="mt-6 font-hand text-[1.75rem] leading-[2.5rem]">{signed.message}</p>
              <p className="mt-2 text-[0.8125rem] text-muted">
                {signed.name}
                {signed.location && `, ${signed.location}`}
              </p>
              <p className="mt-8 border-t border-line pt-6 text-[0.9375rem] text-ink-soft">
                Thank you for signing. Your entry will appear in the book once the family has read it.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="relative" noValidate>
              <h3 className="font-serif text-3xl">Sign the book</h3>
              <p className="mt-2 text-[0.9375rem] text-muted">Your name and a line or two, as you would at the door.</p>
              <div className="mt-8 grid gap-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="Name" name="name" required maxLength={80} autoComplete="name" error={errors.name} />
                  <Field label="From" name="location" optional maxLength={60} placeholder="Town or city" error={errors.location} />
                </div>
                <Field label="Message" name="message" required maxLength={200} placeholder="With love and remembrance…" error={errors.message} />
              </div>
              <Honeypot />
              {state && !state.ok && state.message && (
                <p role="alert" className="field-error mt-5">
                  {state.message}
                </p>
              )}
              <button type="submit" className="btn btn-primary mt-9" disabled={pending}>
                {pending ? "Signing…" : "Sign the Guestbook"}
              </button>
            </form>
          )}
        </div>

        {/* Right page — read */}
        <div className="flex flex-col p-7 sm:p-10 lg:p-14">
          {entries.length === 0 ? (
            <p className="m-auto py-10 text-center font-serif text-2xl italic text-muted">The first page is waiting.</p>
          ) : (
            <ul className="ruled flex-1" style={{ minHeight: `${PER_PAGE * 7.5}rem` }}>
              {shown.map((entry) => (
                <li key={entry.id} className="pb-[2.5rem]">
                  <p className="font-hand text-[1.625rem] leading-[2.5rem] text-ink">{entry.message}</p>
                  <p className="text-[0.8125rem] leading-[2.5rem] text-muted">
                    <span className="text-ink-soft">{entry.name}</span>
                    {entry.location && `, ${entry.location}`}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {pages > 1 && (
            <nav className="no-print mt-6 flex items-center justify-between border-t border-line pt-5" aria-label="Guestbook pages">
              <button
                type="button"
                className="grid size-11 place-items-center rounded-full text-muted transition-colors hover:text-ink disabled:opacity-30"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                aria-label="Previous page"
              >
                <Icon name="arrow-left" />
              </button>
              <p className="text-xs tabular-nums tracking-[0.2em] text-muted" aria-live="polite">
                Page {page + 1} of {pages}
              </p>
              <button
                type="button"
                className="grid size-11 place-items-center rounded-full text-muted transition-colors hover:text-ink disabled:opacity-30"
                onClick={() => setPage(page + 1)}
                disabled={page >= pages - 1}
                aria-label="Next page"
              >
                <Icon name="arrow-right" />
              </button>
            </nav>
          )}
        </div>
      </div>
    </Reveal>
  );
}

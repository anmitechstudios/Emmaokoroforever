"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { submitMemory, submitTribute, type SubmitState } from "@/lib/actions/public";
import { downscale, useStored, useSubmit } from "@/lib/client";
import type { PublicTribute } from "@/lib/db/types";
import { Field, Honeypot, TextArea } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";

// One submission experience, reached from every "Leave a Tribute" / "Share a
// Memory" action on the site. It opens in whichever mode the button asked for
// and lets the visitor switch between the two.

export type TributeMode = "tribute" | "memory";

const Context = createContext<(mode?: TributeMode) => void>(() => {});
export const useTributeDialog = () => useContext(Context);

const EMPTY: PublicTribute[] = [];
/** Tributes this visitor has sent that are still waiting for the family's review. */
export function useMyTributes() {
  return useStored<PublicTribute[]>("memorial:my-tributes", EMPTY);
}

export function TributeProvider({ shortName, children }: { shortName: string; children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; mode: TributeMode; run: number }>({ open: false, mode: "tribute", run: 0 });
  const open = useCallback((mode: TributeMode = "tribute") => setState((s) => ({ open: true, mode, run: s.run + 1 })), []);
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  return (
    <Context.Provider value={open}>
      {children}
      <Modal open={state.open} onClose={close} labelledBy="tribute-title">
        <TributeForm key={state.run} initialMode={state.mode} shortName={shortName} onClose={close} />
      </Modal>
    </Context.Provider>
  );
}

/** Any button that opens the tribute dialog. */
export function TributeButton({
  mode = "tribute",
  className = "btn btn-primary",
  children,
}: {
  mode?: TributeMode;
  className?: string;
  children: ReactNode;
}) {
  const open = useTributeDialog();
  return (
    <button type="button" className={className} onClick={() => open(mode)}>
      {children}
    </button>
  );
}

const COPY = {
  tribute: {
    title: "Leave a tribute",
    prompt: "Share a memory, a message, a prayer, or words of comfort.",
    label: "Your tribute",
    placeholder: "What would you like to say?",
    submit: "Send tribute",
    max: 2000,
  },
  memory: {
    title: "Share a memory",
    prompt: "What's one thing you'll always remember?",
    label: "Your memory",
    placeholder: "A moment, a habit, a saying, a laugh…",
    submit: "Share memory",
    max: 600,
  },
} as const;

function TributeForm({ initialMode, shortName, onClose }: { initialMode: TributeMode; shortName: string; onClose: () => void }) {
  const [mode, setMode] = useState(initialMode);
  const [length, setLength] = useState(0);
  const [photo, setPhoto] = useState<{ name: string; preview: string } | null>(null);
  const openedAt = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const copy = COPY[mode];

  useEffect(() => {
    openedAt.current = Date.now();
  }, []);
  useEffect(() => () => void (photo && URL.revokeObjectURL(photo.preview)), [photo]);

  const formRef = useRef<HTMLFormElement>(null);
  const { state, pending, onSubmit } = useSubmit(
    async (form: FormData): Promise<SubmitState<PublicTribute | undefined>> => {
      form.set("elapsed", String(Date.now() - openedAt.current));
      try {
        if (mode === "memory") {
          form.set("body", String(form.get("message") ?? ""));
          const result = await submitMemory(null, form);
          // The shared textarea is called "message"; point its error back at it.
          if (result && !result.ok && result.errors?.body) return { ...result, errors: { ...result.errors, message: result.errors.body } };
          return result;
        }
        const file = form.get("photo");
        if (file instanceof File && file.size > 0) form.set("photo", await downscale(file));
        return await submitTribute(null, form);
      } catch {
        return { ok: false, message: "Something went wrong while sending. Please check your connection and try again." };
      }
    },
    (result) => {
      // Take keyboard and screen-reader users straight to the first problem.
      if (result && !result.ok) requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
    },
  );

  if (state?.ok) {
    return (
      <div className="px-6 py-16 text-center sm:px-14 sm:py-20" role="status">
        <span className="mx-auto grid size-14 place-items-center rounded-full border border-line text-accent">
          <Icon name="check" size={22} />
        </span>
        <h2 id="tribute-title" className="mt-8 font-serif text-4xl sm:text-5xl">
          Thank you.
        </h2>
        <p className="mx-auto mt-5 max-w-sm text-ink-soft">
          {mode === "memory"
            ? "Your memory has been received. The family reads every memory, and yours will appear on the wall once they have."
            : "Your tribute has been added to the memorial."}
        </p>
        <button type="button" className="btn btn-outline mt-10" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  const errors = (state && !state.ok && state.errors) || {};

  return (
    <form ref={formRef} onSubmit={onSubmit} className="relative px-6 pb-8 pt-12 sm:px-14 sm:pb-12 sm:pt-14" noValidate>
      <p className="eyebrow">Remembering {shortName}</p>
      <h2 id="tribute-title" className="mt-3 font-serif text-4xl leading-none sm:text-5xl">
        {copy.title}
      </h2>

      <div className="mt-7 inline-flex rounded-full border border-line p-1" role="radiogroup" aria-label="What would you like to share?">
        {(["tribute", "memory"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={mode === option}
            onClick={() => setMode(option)}
            className={`rounded-full px-4 py-2 text-[0.6875rem] font-medium uppercase tracking-[0.14em] transition-colors duration-500 ${
              mode === option ? "bg-ink text-paper" : "text-muted hover:text-ink"
            }`}
          >
            {option === "tribute" ? "A tribute" : "A memory"}
          </button>
        ))}
      </div>

      <p className="mt-6 font-serif text-2xl italic leading-snug text-ink-soft">{copy.prompt}</p>

      <div className="mt-8 grid gap-7">
        <div className="grid gap-7 sm:grid-cols-2">
          <Field label="Your name" name="name" required autoComplete="name" maxLength={80} error={errors.name} />
          <Field
            label="Relationship"
            name="relationship"
            optional
            placeholder="Friend, colleague, neighbour…"
            maxLength={80}
            error={errors.relationship}
          />
        </div>

        {mode === "tribute" && (
          <Field
            label="Email"
            name="email"
            type="email"
            optional
            autoComplete="email"
            maxLength={200}
            hint="Never shown on this page. Only the family can see it, should they wish to thank you."
            error={errors.email}
          />
        )}

        <div>
          <TextArea
            label={copy.label}
            name="message"
            required
            rows={mode === "memory" ? 4 : 6}
            maxLength={copy.max}
            placeholder={copy.placeholder}
            onChange={(event) => setLength(event.target.value.length)}
            error={errors.message}
          />
          <p className="mt-1.5 text-right text-xs tabular-nums text-muted" aria-hidden="true">
            {length} / {copy.max}
          </p>
        </div>

        {mode === "tribute" && (
          <div>
            <span className="field-label">
              Photo<span className="optional">(optional)</span>
            </span>
            <input
              ref={fileInput}
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="sr-only"
              id="tribute-photo"
              aria-describedby={errors.photo ? "photo-error" : undefined}
              onChange={(event) => {
                const file = event.target.files?.[0];
                setPhoto(file ? { name: file.name, preview: URL.createObjectURL(file) } : null);
              }}
            />
            {photo ? (
              <div className="flex items-center gap-4">
                {/* A local preview of a file that has not been uploaded yet. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.preview} alt="" className="size-16 rounded-[2px] object-cover" />
                <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">{photo.name}</span>
                <button
                  type="button"
                  className="link-line"
                  onClick={() => {
                    if (fileInput.current) fileInput.current.value = "";
                    setPhoto(null);
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <label
                htmlFor="tribute-photo"
                className="flex cursor-pointer items-center gap-3 rounded-[2px] border border-dashed border-line px-4 py-4 text-sm text-muted transition-colors duration-500 hover:border-muted hover:text-ink has-[:focus-visible]:border-ink"
              >
                <Icon name="image" />
                Add a photograph you'd like to share
              </label>
            )}
            {errors.photo && (
              <p id="photo-error" role="alert" className="field-error">
                {errors.photo}
              </p>
            )}
          </div>
        )}
      </div>

      <Honeypot />

      {state && !state.ok && state.message && (
        <p role="alert" className="field-error mt-6">
          {state.message}
        </p>
      )}

      <div className="mt-10 flex flex-col-reverse items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[19rem] text-[0.8125rem] leading-snug text-muted">
          {mode === "memory"
            ? "Memories are read by the family before they appear."
            : "Your tribute will appear on the memorial straight away."}
        </p>
        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={pending}>
          {pending ? "Sending…" : copy.submit}
        </button>
      </div>
    </form>
  );
}

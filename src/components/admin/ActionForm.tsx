"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { AdminState } from "@/lib/actions/admin";
import { downscale, useSubmit } from "@/lib/client";
import { Icon } from "@/components/ui/Icon";

const LABELS: Record<string, string> = {
  full_name: "Full name",
  short_name: "Short name",
  born_on: "Date of birth",
  died_on: "Date of passing",
  hero_image: "Portrait",
  contact_email: "Contact email",
  livestream_url: "Livestream link",
  link: "Link",
  file: "File",
  poster: "Poster image",
  current: "Current password",
  next: "New password",
};

/** A dashboard form: submits to a Server Action and reports the outcome beside the button. */
export function ActionForm({
  action,
  children,
  submit = "Save changes",
  className,
  resetOnSuccess = false,
  secondary,
}: {
  action: (state: AdminState, form: FormData) => Promise<AdminState>;
  children: ReactNode;
  submit?: string;
  className?: string;
  resetOnSuccess?: boolean;
  secondary?: ReactNode;
}) {
  const { state, pending, onSubmit } = useSubmit(
    async (form: FormData) => {
      for (const [name, value] of [...form.entries()]) {
        if (value instanceof File && value.size > 0 && value.type.startsWith("image/")) form.set(name, await downscale(value, 2400));
      }
      try {
        return await action(null, form);
      } catch (error) {
        console.error(error);
        return { ok: false, message: "The server couldn't complete that. Please try again — if it keeps happening, check /api/health." };
      }
    },
    (result, element) => {
      if (result?.ok && resetOnSuccess) element.reset();
    },
  );
  const errors = Object.entries(state?.errors ?? {});

  return (
    <form onSubmit={onSubmit} className={className}>
      {children}
      {errors.length > 0 && (
        <ul role="alert" className="mt-4 space-y-1 rounded border border-[#a4483a]/30 bg-[#a4483a]/5 px-4 py-3 text-sm text-[#8f3b2f]">
          {errors.map(([field, message]) => (
            <li key={field}>
              <strong className="font-medium">{LABELS[field] ?? field.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())}:</strong> {message}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Saving…" : submit}
        </button>
        {secondary}
        <p role="status" className={`text-sm ${state?.ok ? "text-[#4d6b4a]" : "text-[#8f3b2f]"}`}>
          {!pending && state?.message && errors.length === 0 ? state.message : ""}
        </p>
      </div>
    </form>
  );
}

/** Delete, with a second click to confirm — no browser pop-ups. */
export function DeleteButton({ action, label = "Delete" }: { action: () => Promise<AdminState>; label?: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  if (!armed) {
    return (
      <button type="button" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-[#8f3b2f]" onClick={() => setArmed(true)}>
        <Icon name="trash" size={15} />
        {label}
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-3 text-sm">
      <button
        type="button"
        className="font-medium text-[#8f3b2f] underline underline-offset-4"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await action();
            if (result && !result.ok) setError(result.message ?? "Couldn't delete.");
          })
        }
      >
        {pending ? "Deleting…" : "Yes, delete"}
      </button>
      <button type="button" className="text-muted hover:text-ink" onClick={() => setArmed(false)}>
        Cancel
      </button>
      {error && <span role="alert" className="text-[#8f3b2f]">{error}</span>}
    </span>
  );
}

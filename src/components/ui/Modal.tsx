"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * A modal built on the native <dialog>: focus is trapped, Escape closes it,
 * and the page behind becomes inert — all handled by the browser. The open
 * and close transitions live in globals.css (`dialog.sheet`).
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  label,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  label?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const width = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl" }[size];

  return (
    <dialog
      ref={ref}
      className={`sheet w-[calc(100vw-1.5rem)] ${width}`}
      aria-labelledby={labelledBy}
      aria-label={label}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain rounded-[2px] bg-paper text-ink shadow-lift">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-full text-muted transition-colors duration-300 hover:text-ink sm:right-5 sm:top-5"
          aria-label="Close"
        >
          <Icon name="close" size={20} />
        </button>
        {children}
      </div>
    </dialog>
  );
}

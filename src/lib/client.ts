"use client";

import { useCallback, useState, useSyncExternalStore, useTransition, type FormEvent } from "react";

/** Shrinks large phone photos in the browser so uploads are quick on mobile data. */
export async function downscale(file: File, maxEdge = 2000): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < 1_200_000) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
    return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function read<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    // Storage unavailable (private mode) — behave as empty.
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value = fallback;
  try {
    if (raw) value = JSON.parse(raw) as T;
  } catch {
    // Corrupt entry — ignore it.
  }
  cache.set(key, { raw, value });
  return value;
}

/** A value remembered in this browser only — which tributes you've hearted, whether you've lit a candle. */
export function useStored<T>(key: string, fallback: T): [T, (next: T) => void] {
  const subscribe = useCallback((notify: () => void) => {
    listeners.add(notify);
    window.addEventListener("storage", notify);
    return () => {
      listeners.delete(notify);
      window.removeEventListener("storage", notify);
    };
  }, []);
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback,
  );
  const set = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Nothing to do.
      }
      listeners.forEach((notify) => notify());
    },
    [key],
  );
  return [value, set];
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Submits a form to a Server Action without React's automatic form reset, so
 * that when validation fails nothing the visitor has typed is lost.
 */
export function useSubmit<S>(action: (form: FormData) => Promise<S>, onDone?: (state: S, form: HTMLFormElement) => void) {
  const [state, setState] = useState<S | null>(null);
  const [pending, start] = useTransition();
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    start(async () => {
      const next = await action(form);
      setState(next);
      onDone?.(next, element);
    });
  };
  return { state, pending, onSubmit };
}

"use client";

import { useRef, useState } from "react";
import { uploadGalleryImage } from "@/lib/actions/admin";
import { downscale } from "@/lib/client";
import { GALLERY_CATEGORIES } from "@/lib/db/types";
import { Icon } from "@/components/ui/Icon";

/** Uploads any number of photographs, one request each, shrinking large ones in the browser first. */
export function GalleryUploader() {
  const input = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<string>(GALLERY_CATEGORIES[0]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [problems, setProblems] = useState<string[]>([]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const list = [...files];
    const failed: string[] = [];
    setProblems([]);
    for (const [i, file] of list.entries()) {
      setProgress({ done: i, total: list.length });
      try {
        const form = new FormData();
        form.set("file", await downscale(file, 2400));
        form.set("category", category);
        const result = await uploadGalleryImage(form);
        if (result && !result.ok) failed.push(`${file.name}: ${result.message}`);
      } catch {
        failed.push(`${file.name}: the upload was interrupted.`);
      }
    }
    setProgress(null);
    setProblems(failed);
    if (input.current) input.current.value = "";
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="upload-category" className="field-label">Add to album</label>
          <select id="upload-category" className="input w-auto min-w-44" value={category} onChange={(e) => setCategory(e.target.value)}>
            {GALLERY_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <label className={`btn btn-primary btn-sm cursor-pointer has-[:focus-visible]:outline ${progress ? "pointer-events-none opacity-50" : ""}`}>
          <Icon name="plus" size={15} />
          {progress ? `Uploading ${progress.done + 1} of ${progress.total}…` : "Choose photographs"}
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={progress !== null} onChange={(e) => upload(e.target.files)} />
        </label>
      </div>
      <p className="mt-3 text-sm text-muted">JPG or PNG. Choose as many as you like — captions and dates can be added afterwards.</p>
      <p role="status" className="sr-only">{progress ? `Uploading photograph ${progress.done + 1} of ${progress.total}` : ""}</p>
      {problems.length > 0 && (
        <ul role="alert" className="mt-3 space-y-1 text-sm text-[#8f3b2f]">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export type RepeaterField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "image";
  placeholder?: string;
  rows?: number;
  wide?: boolean;
  hint?: string;
};

type Item = Record<string, string> & { id: string };

/**
 * An editable, re-orderable list (story chapters, favourite things, the order
 * of service). The whole list travels as JSON in one hidden field; image
 * fields upload alongside as `${name}__${itemId}__${fieldKey}`.
 */
export function Repeater({
  name,
  initial,
  fields,
  itemLabel,
  addLabel,
}: {
  name: string;
  initial: Item[];
  fields: RepeaterField[];
  itemLabel: string;
  addLabel: string;
}) {
  const [items, setItems] = useState<Item[]>(initial);

  const change = (id: string, key: string, value: string) =>
    setItems((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  const move = (index: number, by: number) =>
    setItems((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(index + by, 0, item);
      return next;
    });
  const add = () =>
    setItems((current) => [...current, { id: crypto.randomUUID(), ...Object.fromEntries(fields.map((f) => [f.key, ""])) } as Item]);

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(items)} readOnly />
      <ol className="space-y-4">
        {items.map((item, index) => (
          <li key={item.id} className="card p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="eyebrow">
                {itemLabel} {index + 1}
              </p>
              <div className="flex items-center gap-1 text-muted">
                <button type="button" className="grid size-8 place-items-center rounded hover:text-ink disabled:opacity-30" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move ${itemLabel.toLowerCase()} ${index + 1} up`}>
                  <Icon name="arrow-down" size={16} className="rotate-180" />
                </button>
                <button type="button" className="grid size-8 place-items-center rounded hover:text-ink disabled:opacity-30" disabled={index === items.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${itemLabel.toLowerCase()} ${index + 1} down`}>
                  <Icon name="arrow-down" size={16} />
                </button>
                <button type="button" className="ml-2 grid size-8 place-items-center rounded hover:text-[#8f3b2f]" onClick={() => setItems((current) => current.filter((i) => i.id !== item.id))} aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`}>
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => {
                const id = `${name}-${item.id}-${field.key}`;
                return (
                  <div key={field.key} className={field.wide || field.type === "textarea" ? "sm:col-span-2" : ""}>
                    <label htmlFor={id} className="field-label">
                      {field.label}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea id={id} className="input" rows={field.rows ?? 4} value={item[field.key] ?? ""} placeholder={field.placeholder} onChange={(e) => change(item.id, field.key, e.target.value)} />
                    ) : field.type === "image" ? (
                      <div className="flex items-center gap-4">
                        {item[field.key] && (
                          // A small admin thumbnail; not worth an optimised image.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item[field.key]} alt="" className="size-16 rounded object-cover" />
                        )}
                        <div className="min-w-0 flex-1">
                          <input id={id} type="file" name={`${name}__${item.id}__${field.key}`} accept="image/jpeg,image/png,image/webp" className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border file:border-line file:bg-surface file:px-4 file:py-2 file:text-sm file:text-ink" />
                          {item[field.key] && (
                            <button type="button" className="mt-1.5 text-xs text-muted underline underline-offset-4 hover:text-ink" onClick={() => change(item.id, field.key, "")}>
                              Remove current image
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <input id={id} className="input" value={item[field.key] ?? ""} placeholder={field.placeholder} onChange={(e) => change(item.id, field.key, e.target.value)} />
                    )}
                    {field.hint && <p className="mt-1 text-xs text-muted">{field.hint}</p>}
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="mt-4 inline-flex items-center gap-2 rounded-full border border-dashed border-line px-4 py-2.5 text-sm text-ink-soft hover:border-muted" onClick={add}>
        <Icon name="plus" size={16} />
        {addLabel}
      </button>
    </div>
  );
}

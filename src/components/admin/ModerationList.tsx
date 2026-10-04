"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { deleteRow, editEntry, moderate, type Moderated } from "@/lib/actions/admin";
import type { Status } from "@/lib/db/types";
import { Icon } from "@/components/ui/Icon";
import { ActionForm, DeleteButton } from "./ActionForm";

export type ModerationItem = {
  id: string;
  name: string;
  detail: string; // relationship or location
  text: string;
  email?: string;
  photo_url?: string;
  status: Status;
  created: string; // already formatted
  likes?: number;
  reports?: number;
};

const BADGE: Record<Status, string> = {
  pending: "border-[#b98a3c]/40 bg-[#b98a3c]/10 text-[#7d5a1c]",
  approved: "border-[#4d6b4a]/30 bg-[#4d6b4a]/10 text-[#3c5639]",
  rejected: "border-line bg-line/40 text-muted",
};

export function ModerationList({
  table,
  items,
  detailLabel,
  textLabel,
  detailField,
}: {
  table: Moderated;
  items: ModerationItem[];
  detailLabel?: string;
  textLabel?: string;
  detailField?: "relationship" | "location";
}) {
  if (!items.length) {
    return <p className="card px-6 py-14 text-center text-muted">Nothing here.</p>;
  }
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <Row key={item.id} table={table} item={item} detailLabel={detailLabel} textLabel={textLabel} detailField={detailField} />
      ))}
    </ul>
  );
}

function Row({
  table,
  item,
  detailLabel,
  textLabel,
  detailField,
}: {
  table: Moderated;
  item: ModerationItem;
  detailLabel?: string;
  textLabel?: string;
  detailField?: "relationship" | "location";
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const set = (status: Status) =>
    start(async () => {
      const result = await moderate(table, item.id, status);
      setError(result && !result.ok ? (result.message ?? "That didn't work.") : "");
    });

  return (
    <li className={`card p-5 transition-opacity sm:p-6 ${pending ? "opacity-50" : ""}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${BADGE[item.status]}`}>{item.status}</span>
        {Boolean(item.reports) && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#a4483a]/30 bg-[#a4483a]/10 px-2.5 py-0.5 text-xs font-medium text-[#8f3b2f]">
            <Icon name="flag" size={12} />
            Reported {item.reports}×
          </span>
        )}
        <span className="text-xs text-muted">Submitted {item.created}</span>
        {item.likes ? <span className="text-xs text-muted">· {item.likes} hearts</span> : null}
      </div>

      {editing ? (
        <ActionForm action={editEntry.bind(null, table)} className="mt-4" secondary={<button type="button" className="text-sm text-muted hover:text-ink" onClick={() => setEditing(false)}>Done</button>}>
          <input type="hidden" name="id" value={item.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor={`name-${item.id}`}>Name</label>
              <input id={`name-${item.id}`} name="name" defaultValue={item.name} className="input" maxLength={80} />
            </div>
            {detailField && (
              <div>
                <label className="field-label" htmlFor={`detail-${item.id}`}>{detailLabel}</label>
                <input id={`detail-${item.id}`} name={detailField} defaultValue={item.detail} className="input" maxLength={80} />
              </div>
            )}
            {textLabel && (
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor={`text-${item.id}`}>{textLabel}</label>
                <textarea id={`text-${item.id}`} name="text" defaultValue={item.text} className="input" rows={5} />
              </div>
            )}
          </div>
        </ActionForm>
      ) : (
        <div className="mt-4 flex gap-5">
          {item.photo_url && (
            <a href={item.photo_url} target="_blank" rel="noreferrer" className="relative block size-24 shrink-0 overflow-hidden rounded">
              <Image src={item.photo_url} alt="Photo attached to this tribute" fill sizes="96px" className="object-cover" />
            </a>
          )}
          <div className="min-w-0">
            {item.text && <p className="whitespace-pre-line font-serif text-xl leading-snug">{item.text}</p>}
            <p className={`text-sm ${item.text ? "mt-3" : ""}`}>
              <span className="font-medium">{item.name || "No name"}</span>
              {item.detail && <span className="text-muted"> · {item.detail}</span>}
            </p>
            {item.email && (
              <p className="mt-0.5 text-sm text-muted">
                <a href={`mailto:${item.email}`} className="underline underline-offset-4">{item.email}</a> <span className="text-xs">(private)</span>
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-4">
        {item.status !== "approved" && (
          <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={() => set("approved")}>
            <Icon name="check" size={14} />
            Approve
          </button>
        )}
        {item.status !== "rejected" && (
          <button type="button" className="btn btn-outline btn-sm" disabled={pending} onClick={() => set("rejected")}>
            {item.status === "approved" ? "Unpublish" : "Reject"}
          </button>
        )}
        {!editing && (
          <button type="button" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink" onClick={() => setEditing(true)}>
            <Icon name="edit" size={15} />
            Edit
          </button>
        )}
        <DeleteButton action={deleteRow.bind(null, table, item.id)} />
        {error && <span role="alert" className="text-sm text-[#8f3b2f]">{error}</span>}
      </div>
    </li>
  );
}

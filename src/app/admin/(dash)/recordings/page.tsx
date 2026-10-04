import type { Metadata } from "next";
import { ActionForm, DeleteButton } from "@/components/admin/ActionForm";
import { AdminPage, Area, Input, Panel } from "@/components/admin/Shell";
import { deleteRow, saveMediaItem } from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { MEDIA_CATEGORIES, type MediaItem } from "@/lib/db/types";
import { getMemorial } from "@/lib/queries";

export const metadata: Metadata = { title: "Video & audio" };

const FILE = "block w-full text-sm text-muted file:mr-3 file:rounded-full file:border file:border-line file:bg-surface file:px-4 file:py-2 file:text-sm file:text-ink";

function Fields({ item, order }: { item?: MediaItem; order: number }) {
  const key = item?.id ?? "new";
  const uploaded = Boolean(item?.url) && !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com|m\.youtube\.com)/.test(item!.url);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {item && <input type="hidden" name="id" value={item.id} />}
      <Input label="Title" name="title" id={`title-${key}`} defaultValue={item?.title} required maxLength={160} className="sm:col-span-2" />
      <div>
        <label htmlFor={`kind-${key}`} className="field-label">Type</label>
        <select id={`kind-${key}`} name="kind" defaultValue={item?.kind ?? "video"} className="input">
          <option value="video">Video</option>
          <option value="audio">Audio</option>
        </select>
      </div>
      <div>
        <label htmlFor={`category-${key}`} className="field-label">Kind of recording</label>
        <select id={`category-${key}`} name="category" defaultValue={item?.category ?? MEDIA_CATEGORIES[0]} className="input">
          {MEDIA_CATEGORIES.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </div>
      <Input
        label="YouTube or Vimeo link"
        name="link"
        id={`link-${key}`}
        type="url"
        defaultValue={item && !uploaded ? item.url : ""}
        placeholder="https://www.youtube.com/watch?v=…"
        hint="Best for videos and long recordings such as the funeral service."
        className="sm:col-span-2"
      />
      <div className="sm:col-span-2">
        <label htmlFor={`file-${key}`} className="field-label">…or upload a file</label>
        <input id={`file-${key}`} name="file" type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/ogg,video/mp4,video/webm" className={FILE} />
        <p className="mt-1 text-xs text-muted">
          MP3, M4A, WAV, MP4 or WebM, up to 4 MB — ideal for voice notes and short clips.
          {uploaded && " A file is already uploaded; choosing another replaces it."}
        </p>
      </div>
      <div>
        <label htmlFor={`poster-${key}`} className="field-label">Cover image (video)</label>
        <input id={`poster-${key}`} name="poster" type="file" accept="image/jpeg,image/png,image/webp" className={FILE} />
      </div>
      <Input label="When it was recorded" name="recorded" id={`recorded-${key}`} defaultValue={item?.recorded} maxLength={60} placeholder="March 2018" />
      <Area label="Description (optional)" name="description" id={`description-${key}`} defaultValue={item?.description} maxLength={600} rows={2} className="sm:col-span-2" />
      <input type="hidden" name="sort_order" value={item?.sort_order ?? order} />
    </div>
  );
}

export default async function RecordingsPage() {
  const memorial = await getMemorial();
  const items = await (await db()).list("media", { where: { memorial_id: memorial.id }, order: [{ column: "sort_order" }] });
  const next = items.length ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0;

  return (
    <AdminPage title="Video & audio" intro="Recordings of the service, interviews, voice notes, favourite songs, sermons and speeches.">
      <Panel title="Add a recording">
        <ActionForm action={saveMediaItem} submit="Add recording" resetOnSuccess>
          <Fields order={next} />
        </ActionForm>
      </Panel>

      {items.map((item) => (
        <Panel key={item.id} title={item.title} hint={item.url ? (item.kind === "audio" ? "Audio" : "Video") : "No recording attached yet — shown as “Coming soon”."}>
          <ActionForm action={saveMediaItem} submit="Save" secondary={<DeleteButton action={deleteRow.bind(null, "media", item.id)} />}>
            <Fields item={item} order={next} />
          </ActionForm>
        </Panel>
      ))}
    </AdminPage>
  );
}

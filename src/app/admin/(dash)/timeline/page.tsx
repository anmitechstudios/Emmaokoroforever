import type { Metadata } from "next";
import { ActionForm, DeleteButton } from "@/components/admin/ActionForm";
import { AdminPage, Area, Input, Panel } from "@/components/admin/Shell";
import { deleteRow, saveTimelineEvent } from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { getMemorial } from "@/lib/queries";

export const metadata: Metadata = { title: "Timeline" };

export default async function TimelinePage() {
  const memorial = await getMemorial();
  const events = await (await db()).list("timeline_events", { where: { memorial_id: memorial.id }, order: [{ column: "sort_order" }] });
  const next = events.length ? Math.max(...events.map((e) => e.sort_order)) + 1 : 0;

  return (
    <AdminPage title="Timeline" intro="The important moments, in order. The “Order” number decides where each one sits.">
      <Panel title="Add a moment">
        <ActionForm action={saveTimelineEvent} submit="Add to timeline" resetOnSuccess>
          <input type="hidden" name="sort_order" value={next} />
          <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
            <Input label="Year" name="year" id="new-year" required maxLength={20} placeholder="1990" />
            <Input label="What happened" name="title" id="new-title" required maxLength={160} placeholder="Married Ngozi" />
            <Area label="A sentence more (optional)" name="description" id="new-description" maxLength={600} rows={2} className="sm:col-span-2" />
          </div>
        </ActionForm>
      </Panel>

      <ol className="space-y-4">
        {events.map((event) => (
          <li key={event.id} className="card p-5">
            <ActionForm action={saveTimelineEvent} submit="Save" secondary={<DeleteButton action={deleteRow.bind(null, "timeline_events", event.id)} />}>
              <input type="hidden" name="id" value={event.id} />
              <div className="grid gap-4 sm:grid-cols-[8rem_1fr_5rem]">
                <Input label="Year" name="year" id={`year-${event.id}`} defaultValue={event.year} required maxLength={20} />
                <Input label="What happened" name="title" id={`title-${event.id}`} defaultValue={event.title} required maxLength={160} />
                <Input label="Order" name="sort_order" id={`order-${event.id}`} type="number" min={0} defaultValue={event.sort_order} />
                <Area label="Description" name="description" id={`description-${event.id}`} defaultValue={event.description} maxLength={600} rows={2} className="sm:col-span-3" />
              </div>
            </ActionForm>
          </li>
        ))}
      </ol>
    </AdminPage>
  );
}

import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/ActionForm";
import { Repeater } from "@/components/admin/Repeater";
import { AdminPage, Area, Input, Panel } from "@/components/admin/Shell";
import { saveService } from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { getMemorial } from "@/lib/queries";

export const metadata: Metadata = { title: "Funeral arrangements" };

export default async function ServicePage() {
  const memorial = await getMemorial();
  const [service] = await (await db()).list("service_info", { where: { memorial_id: memorial.id }, limit: 1 });

  return (
    <AdminPage
      title="Funeral arrangements"
      intro="Each service, vigil, burial, reception or thanksgiving is one event. Events are grouped by day on the memorial, in date order. Remove them all to hide this section."
    >
      <ActionForm action={saveService} className="space-y-8">
        {/* Fields from the older single-service layout, kept as they are. */}
        <input type="hidden" name="title" value={service?.title ?? "Funeral Arrangements"} />
        <input type="hidden" name="date" value={service?.date ?? ""} />
        <input type="hidden" name="time" value={service?.time ?? ""} />
        <input type="hidden" name="venue" value={service?.venue ?? ""} />
        <input type="hidden" name="address" value={service?.address ?? ""} />
        <input type="hidden" name="map_query" value={service?.map_query ?? ""} />

        <Panel title="Events">
          <Repeater
            name="schedule"
            itemLabel="Event"
            addLabel="Add an event"
            initial={(service?.schedule ?? []).map((e) => ({ ...e, date: e.date ?? "", venue: e.venue ?? "", map_query: e.map_query ?? "" })) as never}
            fields={[
              { key: "title", label: "What", placeholder: "Burial Service" },
              { key: "date", label: "Date", type: "date" },
              { key: "time", label: "Time", placeholder: "11:00am, or 3:00pm to 5:00pm" },
              { key: "venue", label: "Where", type: "textarea", rows: 2, placeholder: "Venue name and address" },
              {
                key: "map_query",
                label: "Map search (optional)",
                wide: true,
                placeholder: "Hugh Goldie Theological College, Arochukwu",
                hint: "What to type into Google Maps to find the place. Adds a “Directions” link. Leave empty for a private home.",
              },
              { key: "note", label: "Note (optional)", wide: true, placeholder: "Hosted by …, or Follows immediately" },
            ]}
          />
        </Panel>

        <Panel title="For everyone attending">
          <div className="grid gap-4">
            <Area label="A note above the arrangements (optional)" name="notes" defaultValue={service?.notes} maxLength={800} rows={2} />
            <Input label="Dress code (optional)" name="dress_code" defaultValue={service?.dress_code} maxLength={300} />
            <Input label="Livestream link (optional)" name="livestream_url" type="url" defaultValue={service?.livestream_url} placeholder="https://…" />
          </div>
        </Panel>
      </ActionForm>
    </AdminPage>
  );
}

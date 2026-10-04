import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/ActionForm";
import { Repeater } from "@/components/admin/Repeater";
import { AdminPage, Area, Input, Panel } from "@/components/admin/Shell";
import { saveService } from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { getMemorial } from "@/lib/queries";

export const metadata: Metadata = { title: "Service" };

export default async function ServicePage() {
  const memorial = await getMemorial();
  const [service] = await (await db()).list("service_info", { where: { memorial_id: memorial.id }, limit: 1 });

  return (
    <AdminPage title="Service" intro="Funeral or thanksgiving service details. Leave the date and venue empty to hide this section.">
      <ActionForm action={saveService} className="space-y-8">
        <Panel title="When and where">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name of the service" name="title" defaultValue={service?.title} maxLength={120} placeholder="A Service of Thanksgiving" className="sm:col-span-2" />
            <Input label="Date" name="date" type="date" defaultValue={service?.date} />
            <Input label="Time" name="time" defaultValue={service?.time} maxLength={60} placeholder="10:00 am" />
            <Input label="Venue" name="venue" defaultValue={service?.venue} maxLength={160} />
            <Input label="Address" name="address" defaultValue={service?.address} maxLength={300} />
            <Input
              label="Map search"
              name="map_query"
              defaultValue={service?.map_query}
              maxLength={300}
              hint="What you would type into Google Maps to find the venue. Used for the map and “Get Directions”."
              className="sm:col-span-2"
            />
            <Input label="Livestream link" name="livestream_url" type="url" defaultValue={service?.livestream_url} placeholder="https://…" className="sm:col-span-2" />
            <Input label="Dress code" name="dress_code" defaultValue={service?.dress_code} maxLength={300} className="sm:col-span-2" />
            <Area label="A note for guests" name="notes" defaultValue={service?.notes} maxLength={800} className="sm:col-span-2" />
          </div>
        </Panel>

        <Panel title="Order of the day">
          <Repeater
            name="schedule"
            itemLabel="Item"
            addLabel="Add to the schedule"
            initial={(service?.schedule ?? []) as never}
            fields={[
              { key: "time", label: "Time", placeholder: "10:00 am" },
              { key: "title", label: "What", placeholder: "Service of Thanksgiving" },
              { key: "note", label: "Note (optional)", wide: true },
            ]}
          />
        </Panel>
      </ActionForm>
    </AdminPage>
  );
}

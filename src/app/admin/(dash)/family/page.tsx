import type { Metadata } from "next";
import { ActionForm, DeleteButton } from "@/components/admin/ActionForm";
import { AdminPage, Input, Panel } from "@/components/admin/Shell";
import { deleteRow, saveFamilyMember } from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { FAMILY_GROUPS } from "@/lib/db/types";
import { getMemorial } from "@/lib/queries";

export const metadata: Metadata = { title: "Family" };

function GroupSelect({ id, value }: { id: string; value?: string }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">Relationship</label>
      <select id={id} name="family_group" defaultValue={value ?? "children"} className="input">
        {FAMILY_GROUPS.map((group) => (
          <option key={group.key} value={group.key}>
            {group.key === "predeceased" ? "Predeceased (“Reunited with”)" : group.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default async function FamilyPage() {
  const memorial = await getMemorial();
  const members = await (await db()).list("family_members", { where: { memorial_id: memorial.id }, order: [{ column: "sort_order" }] });
  const next = members.length ? Math.max(...members.map((m) => m.sort_order)) + 1 : 0;

  return (
    <AdminPage title="Family" intro="Those who are named under “Survived by”. This section is optional — switch it off in Settings if you prefer.">
      <Panel title="Add a family member">
        <ActionForm action={saveFamilyMember} submit="Add" resetOnSuccess>
          <input type="hidden" name="sort_order" value={next} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Name" name="name" id="new-name" required maxLength={120} />
            <GroupSelect id="new-group" />
            <Input label="Note (optional)" name="note" id="new-note" maxLength={200} placeholder="and spouse’s name" />
          </div>
        </ActionForm>
      </Panel>

      <ul className="space-y-3">
        {members.map((member) => (
          <li key={member.id} className="card p-5">
            <ActionForm action={saveFamilyMember} submit="Save" secondary={<DeleteButton action={deleteRow.bind(null, "family_members", member.id)} />}>
              <input type="hidden" name="id" value={member.id} />
              <div className="grid gap-4 sm:grid-cols-[1fr_1fr_1fr_5rem]">
                <Input label="Name" name="name" id={`name-${member.id}`} defaultValue={member.name} required maxLength={120} />
                <GroupSelect id={`group-${member.id}`} value={member.family_group} />
                <Input label="Note" name="note" id={`note-${member.id}`} defaultValue={member.note} maxLength={200} />
                <Input label="Order" name="sort_order" id={`order-${member.id}`} type="number" min={0} defaultValue={member.sort_order} />
              </div>
            </ActionForm>
          </li>
        ))}
      </ul>
    </AdminPage>
  );
}

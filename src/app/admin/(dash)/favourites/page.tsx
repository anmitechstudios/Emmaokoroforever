import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/ActionForm";
import { Repeater } from "@/components/admin/Repeater";
import { AdminPage } from "@/components/admin/Shell";
import { saveFavorites } from "@/lib/actions/admin";
import { getMemorial } from "@/lib/queries";

export const metadata: Metadata = { title: "Favourite things" };

export default async function FavouritesPage() {
  const memorial = await getMemorial();
  return (
    <AdminPage title="Favourite things" intro="A song, a book, a meal, a place, a saying — the small loves that made up a personality.">
      <ActionForm action={saveFavorites}>
        <Repeater
          name="favorites"
          itemLabel="Favourite"
          addLabel="Add a favourite"
          initial={memorial.favorites as never}
          fields={[
            { key: "label", label: "What", placeholder: "Favourite song" },
            { key: "value", label: "Which", placeholder: "Osondi Owendi" },
            { key: "note", label: "A line about it (optional)", wide: true },
          ]}
        />
      </ActionForm>
    </AdminPage>
  );
}

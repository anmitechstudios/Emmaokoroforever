import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/ActionForm";
import { Repeater } from "@/components/admin/Repeater";
import { AdminPage } from "@/components/admin/Shell";
import { saveChapters } from "@/lib/actions/admin";
import { getMemorial } from "@/lib/queries";

export const metadata: Metadata = { title: "Life story" };

export default async function StoryPage() {
  const memorial = await getMemorial();
  return (
    <AdminPage title="Life story" intro="Tell the story in chapters — early life, family, work, faith, later years. Each chapter can have a photograph and a highlighted quote.">
      <ActionForm action={saveChapters} submit="Save story">
        <Repeater
          name="chapters"
          itemLabel="Chapter"
          addLabel="Add a chapter"
          initial={memorial.chapters as never}
          fields={[
            { key: "kicker", label: "Period or theme", placeholder: "1958 — 1976 · Early life" },
            { key: "title", label: "Chapter title", placeholder: "A child of Yaba" },
            { key: "body", label: "The story", type: "textarea", rows: 8, hint: "Leave a blank line between paragraphs." },
            { key: "pull_quote", label: "Highlighted quote (optional)", wide: true, placeholder: "Something they said, or something said of them" },
            { key: "image_url", label: "Photograph", type: "image" },
            { key: "image_caption", label: "Caption" },
          ]}
        />
      </ActionForm>
    </AdminPage>
  );
}

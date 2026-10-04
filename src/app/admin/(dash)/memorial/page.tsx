import type { Metadata } from "next";
import Image from "next/image";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminPage, Area, Input, Panel } from "@/components/admin/Shell";
import { saveMemorial } from "@/lib/actions/admin";
import { getMemorial } from "@/lib/queries";

export const metadata: Metadata = { title: "Name & portrait" };

export default async function MemorialPage() {
  const m = await getMemorial();
  return (
    <AdminPage title="Name & portrait" intro="The first screen visitors see: who the memorial is for.">
      <ActionForm action={saveMemorial} className="space-y-8">
        <Panel title="Name and dates">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" name="full_name" defaultValue={m.full_name} required maxLength={120} className="sm:col-span-2" />
            <Input label="Known as" name="short_name" defaultValue={m.short_name} required maxLength={40} hint="Used in headings such as “The life of …”" />
            <Input label="Title (optional)" name="honorific" defaultValue={m.honorific} maxLength={40} placeholder="Elder, Chief, Dr, Mama…" />
            <Input label="Date of birth" name="born_on" type="date" defaultValue={m.born_on} required />
            <Input label="Date of passing" name="died_on" type="date" defaultValue={m.died_on} required />
            <Input label="Place of birth" name="birthplace" defaultValue={m.birthplace} maxLength={120} />
            <Input label="Opening phrase" name="epitaph" defaultValue={m.epitaph} required maxLength={60} hint="“In Loving Memory”, “Celebrating the Life of”…" />
          </div>
        </Panel>

        <Panel title="Portrait" hint="A clear photograph, ideally taller than it is wide. It is cropped into an arch.">
          <div className="flex flex-wrap items-start gap-6">
            <div className="arch relative aspect-[4/5] w-32 shrink-0 bg-line/40">
              {m.hero_image_url && <Image src={m.hero_image_url} alt="" fill sizes="128px" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <label htmlFor="hero_image" className="field-label">{m.hero_image_url ? "Replace portrait" : "Add a portrait"}</label>
                <input id="hero_image" name="hero_image" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border file:border-line file:bg-surface file:px-4 file:py-2 file:text-sm file:text-ink" />
              </div>
              <Input label="Description of the photograph" name="hero_image_alt" defaultValue={m.hero_image_alt} maxLength={200} hint="Read aloud to visitors who can't see the image." />
            </div>
          </div>
        </Panel>

        <Panel title="Words">
          <div className="grid gap-4">
            <Area label="Quote, scripture or personal message" name="quote" defaultValue={m.quote} maxLength={400} rows={2} />
            <Input label="Source of the quote" name="quote_source" defaultValue={m.quote_source} maxLength={120} placeholder="Psalm 23, or the person who said it" />
            <Area label="Introduction to the life story" name="story_intro" defaultValue={m.story_intro} maxLength={800} rows={3} hint="Two or three sentences in larger type, above the first chapter." />
            <Area label="Closing message from the family" name="closing_message" defaultValue={m.closing_message} maxLength={800} rows={3} />
          </div>
        </Panel>
      </ActionForm>
    </AdminPage>
  );
}

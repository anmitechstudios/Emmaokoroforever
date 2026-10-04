import type { Metadata } from "next";
import Image from "next/image";
import { ActionForm, DeleteButton } from "@/components/admin/ActionForm";
import { GalleryUploader } from "@/components/admin/GalleryUploader";
import { AdminPage, Input } from "@/components/admin/Shell";
import { deleteRow, saveGalleryImage } from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { GALLERY_CATEGORIES } from "@/lib/db/types";
import { getMemorial } from "@/lib/queries";

export const metadata: Metadata = { title: "Photographs" };

export default async function GalleryPage() {
  const memorial = await getMemorial();
  const images = await (await db()).list("gallery_images", { where: { memorial_id: memorial.id }, order: [{ column: "sort_order" }] });

  return (
    <AdminPage title="Photographs" intro={`${images.length} in the album. Add a caption and a year to each, and sort them into albums.`}>
      <GalleryUploader />

      <ul className="grid gap-4 md:grid-cols-2">
        {images.map((image) => (
          <li key={image.id} className="card p-4">
            <div className="flex gap-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded bg-line/40">
                <Image src={image.url} alt="" fill sizes="96px" className="object-cover" />
              </div>
              <ActionForm action={saveGalleryImage} submit="Save" className="min-w-0 flex-1" secondary={<DeleteButton action={deleteRow.bind(null, "gallery_images", image.id)} />}>
                <input type="hidden" name="id" value={image.id} />
                <div className="grid gap-3">
                  <Input label="Caption" name="caption" id={`caption-${image.id}`} defaultValue={image.caption} maxLength={200} />
                  <div className="grid grid-cols-[1fr_5.5rem_4rem] gap-3">
                    <div>
                      <label htmlFor={`category-${image.id}`} className="field-label">Album</label>
                      <select id={`category-${image.id}`} name="category" defaultValue={image.category} className="input">
                        {["", ...GALLERY_CATEGORIES].map((category) => (
                          <option key={category} value={category}>
                            {category || "None"}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input label="Date" name="taken" id={`taken-${image.id}`} defaultValue={image.taken} maxLength={40} placeholder="1987" />
                    <Input label="Order" name="sort_order" id={`order-${image.id}`} type="number" min={0} defaultValue={image.sort_order} />
                  </div>
                </div>
              </ActionForm>
            </div>
          </li>
        ))}
      </ul>
    </AdminPage>
  );
}

import type { Metadata } from "next";
import { ModerationPage } from "@/components/admin/ModerationPage";

export const metadata: Metadata = { title: "Tributes" };

export default function Page({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  return <ModerationPage table="tributes" title="Tributes & condolences" intro="Tributes appear on the memorial as soon as they are sent. Unpublish or delete anything that shouldn’t be there; one reported by three visitors is hidden and waits here. A visitor’s email, if given, is shown only here." searchParams={searchParams} />;
}

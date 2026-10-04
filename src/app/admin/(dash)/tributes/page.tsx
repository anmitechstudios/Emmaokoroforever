import type { Metadata } from "next";
import { ModerationPage } from "@/components/admin/ModerationPage";

export const metadata: Metadata = { title: "Tributes" };

export default function Page({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  return <ModerationPage table="tributes" title="Tributes & condolences" intro="Messages are hidden until you approve them. A visitor’s email, if given, is shown only here." searchParams={searchParams} />;
}

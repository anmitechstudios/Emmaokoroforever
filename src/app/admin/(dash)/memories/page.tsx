import type { Metadata } from "next";
import { ModerationPage } from "@/components/admin/ModerationPage";

export const metadata: Metadata = { title: "Memories" };

export default function Page({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  return <ModerationPage table="memories" title="Memories" intro="Short recollections for the memory wall." searchParams={searchParams} />;
}

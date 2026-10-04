import type { Metadata } from "next";
import { ModerationPage } from "@/components/admin/ModerationPage";

export const metadata: Metadata = { title: "Guestbook" };

export default function Page({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  return <ModerationPage table="guestbook_entries" title="Guestbook" intro="Names and short messages signed in the book." searchParams={searchParams} />;
}

import type { Metadata } from "next";
import { ModerationPage } from "@/components/admin/ModerationPage";
import { db } from "@/lib/db";
import { getMemorial } from "@/lib/queries";

export const metadata: Metadata = { title: "Candles" };

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const memorial = await getMemorial();
  const total = await (await db()).count("candles", { where: { memorial_id: memorial.id } });
  return (
    <ModerationPage
      table="candles"
      title="Candles"
      intro="Candles are counted straight away. A name added to a candle appears only after you approve it."
      searchParams={searchParams}
      onlyNamed
    >
      <p className="card flex items-baseline gap-3 px-6 py-5">
        <span className="font-serif text-5xl font-light lining-nums tabular-nums text-accent">{total}</span>
        <span className="text-muted">candles lit so far. Those with a name are listed below.</span>
      </p>
    </ModerationPage>
  );
}

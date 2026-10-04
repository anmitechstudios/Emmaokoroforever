import { NextResponse, type NextRequest } from "next/server";
import { listTributes, type TributeSort } from "@/lib/queries";
import { allow, visitorHash } from "@/lib/security/guard";

// Search, sorting and "read more" for the public tribute list.
export async function GET(request: NextRequest) {
  if (!allow(`tributes:${await visitorHash()}`, 120, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const params = request.nextUrl.searchParams;
  const offset = Math.max(0, Math.min(5000, Number.parseInt(params.get("offset") ?? "0", 10) || 0));
  const sort: TributeSort = params.get("sort") === "loved" ? "loved" : "newest";
  const data = await listTributes({ search: (params.get("q") ?? "").slice(0, 80), sort, offset });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}

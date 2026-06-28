import { NextResponse } from "next/server";
import { getThreats } from "@/lib/threats";

// Re-validate every 4 hours, matching the Pixqui edition cadence (06/10/14/18/22:00).
export const revalidate = 14400;

export async function GET() {
  const feed = await getThreats(12);
  return NextResponse.json(feed, {
    headers: {
      "Cache-Control": "public, s-maxage=14400, stale-while-revalidate=86400",
    },
  });
}

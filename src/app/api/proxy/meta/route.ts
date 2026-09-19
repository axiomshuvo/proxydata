import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getLocations, getPoolStats } from "@/lib/dataimpulse/client";

const getCachedLocations = unstable_cache(
  async () => {
    try {
      return await getLocations();
    } catch (e) {
      console.error("Error fetching locations", e);
      return {};
    }
  },
  ["dataimpulse-locations"],
  { revalidate: 3600 } // 1 Hour
);

const getCachedStats = unstable_cache(
  async () => {
    try {
      return await getPoolStats();
    } catch (e) {
      console.error("Error fetching pool stats", e);
      return {};
    }
  },
  ["dataimpulse-stats"],
  { revalidate: 900 } // 15 Mins
);

export async function GET() {
  try {
    const [locations, stats] = await Promise.all([
      getCachedLocations(),
      getCachedStats()
    ]);
    return NextResponse.json(
      { locations, stats },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to load meta data" }, { status: 500 });
  }
}

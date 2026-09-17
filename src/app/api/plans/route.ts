import { NextResponse } from "next/server";
import clientPromise from "@/lib/db/mongodb";
import { getResellerBalance } from "@/lib/dataimpulse/client";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();

    // 1. Fetch all ACTIVE plans
    const plans = await db.collection("plans").find({ status: "ACTIVE" }).toArray();
    
    // 2. Fetch live upstream stock (Cached / Single flight if needed, but doing directly here for simplicity)
    let upstreamGbAvailable = 0;
    try {
      upstreamGbAvailable = await getResellerBalance();
    } catch (e) {
      console.warn("Could not fetch upstream balance. Assuming 0.", e);
    }

    // 3. Flag out-of-stock plans
    // (If the requested GB is greater than what we physically have left at DataImpulse)
    const catalog = plans.map(plan => {
      // Very basic stock calculation (could apply coefficient-adjusted logic here if we have overprovisioning)
      const isOutOfStock = plan.bandwidthGb > upstreamGbAvailable;
      
      return {
        ...plan,
        _id: plan._id.toString(),
        outOfStock: isOutOfStock,
        // Optional: you can hide the exact upstreamGbAvailable from the user, just send boolean
      };
    });

    return NextResponse.json({ plans: catalog });
  } catch (error) {
    console.error("GET /api/plans Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

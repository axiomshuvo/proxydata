import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import clientPromise from "@/lib/db/mongodb";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clientPromise;
    const db = client.db();

    // Fetch user's transaction history, newest first
    const transactions = await db.collection("transactions")
      .find({ userId: session.user.publicUserId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
      
    // Format ObjectIds for client consumption
    const formatted = transactions.map(tx => ({
      ...tx,
      _id: tx._id.toString()
    }));

    return NextResponse.json({ transactions: formatted });
  } catch (error) {
    console.error("GET /api/transactions Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db();

    // Fetch user's transaction history, newest first (scoped — never others').
    const [transactions, total] = await Promise.all([
      db.collection("transactions")
        .find({ userId: session.user.publicUserId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("transactions").countDocuments({ userId: session.user.publicUserId }),
    ]);

    // Format ObjectIds for client consumption
    const formatted = transactions.map(tx => ({
      ...tx,
      _id: tx._id.toString()
    }));

    return NextResponse.json({ transactions: formatted, page, limit, total });
  } catch (error) {
    console.error("GET /api/transactions Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

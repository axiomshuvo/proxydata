import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { mongoClient } from "@/lib/db/mongodb";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = mongoClient.db();

    const accounts = await db.collection("proxy_accounts")
      .find({ userId: session.user.publicUserId })
      .toArray();

    // Map the mongo _id to strings
    const formatted = accounts.map(acc => ({
      ...acc,
      _id: acc._id.toString()
    }));

    return NextResponse.json({ accounts: formatted });

  } catch (error) {
    console.error("GET /api/proxy/accounts Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

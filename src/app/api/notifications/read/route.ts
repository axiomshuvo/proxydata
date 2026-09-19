import { NextResponse } from "next/server";
import clientPromise from "@/lib/db/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user;

    const client = await clientPromise;
    const db = client.db();

    // Check if a specific notification ID was passed
    let body = {};
    try { body = await req.json(); } catch(e) {}
    
    if (body && (body as any).id) {
       await db.collection("notifications").updateOne(
         { _id: new ObjectId((body as any).id), userId: user.id },
         { $set: { read: true } }
       );
    } else {
       // Mark all as read
       await db.collection("notifications").updateMany(
         { userId: user.id, read: false },
         { $set: { read: true } }
       );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to mark notifications read" }, { status: 500 });
  }
}

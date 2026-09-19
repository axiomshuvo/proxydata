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
    const publicUserId = String((session.user as unknown as { publicUserId?: string }).publicUserId ?? "");
    if (!publicUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clientPromise;
    const db = client.db();

    // Check if a specific notification ID was passed
    let body = {};
    try { body = await req.json(); } catch(e) {}

    if (body && (body as any).id) {
       const rawId = String((body as any).id ?? "");
       if (!ObjectId.isValid(rawId)) {
         return NextResponse.json({ error: "Bad notification id." }, { status: 400 });
       }
       await db.collection("notifications").updateOne(
          { _id: new ObjectId(rawId), userId: publicUserId },
          { $set: { read: true } }
        );
    } else {
       // Mark all as read
       await db.collection("notifications").updateMany(
         { userId: publicUserId, read: false },
         { $set: { read: true } }
       );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to mark notifications read" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import clientPromise from "@/lib/db/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const publicUserId = String((session.user as unknown as { publicUserId?: string }).publicUserId ?? "");
    if (!publicUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const client = await clientPromise;
    const db = client.db();

    // Canonical key is publicUserId (matches the writer — never hex _ids).
    const notifications = await db.collection("notifications")
      .find({ userId: publicUserId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const unreadCount = await db.collection("notifications").countDocuments({ userId: publicUserId, read: false });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

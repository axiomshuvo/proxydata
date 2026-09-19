import { NextResponse } from "next/server";
import clientPromise from "@/lib/db/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user;
    const client = await clientPromise;
    const db = client.db();

    // Fetch the 50 most recent notifications for the logged-in user
    // Admins will fetch notifications where userId is their admin ID (if any exist) or we handle admin globally.
    const notifications = await db.collection("notifications")
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const unreadCount = await db.collection("notifications").countDocuments({ userId: user.id, read: false });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 401 });
  }
}

import { NextResponse } from "next/server";
import clientPromise from "@/lib/db/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((session.user as any).role !== "ROLE_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db();

    const [pendingApprovals, openTickets, unpaidCommissions] = await Promise.all([
      db.collection("transactions").countDocuments({ status: "PENDING" }),
      db.collection("support_tickets").countDocuments({ status: "OPEN" }),
      // Payout queue doesn't exist yet — count unpaid commission decisions instead.
      db.collection("affiliate_commissions").countDocuments({ status: "UNPAID" }),
    ]);

    return NextResponse.json({
      pendingApprovals,
      openTickets,
      pendingPayouts: unpaidCommissions
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 });
  }
}

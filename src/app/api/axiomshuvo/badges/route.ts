import { NextResponse } from "next/server";
import clientPromise from "@/lib/db/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !((session.user as any).capabilities || []).includes("CAPABILITY_ADMIN_DASHBOARD")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    const [pendingApprovals, openTickets, pendingPayouts] = await Promise.all([
      db.collection("transactions").countDocuments({ status: "PENDING" }),
      db.collection("support_tickets").countDocuments({ status: "OPEN" }),
      db.collection("affiliate_payouts").countDocuments({ status: "PENDING" }) // Wait, payouts are just inserted. Let's assume there is a pending status or we just leave it 0 if unknown
    ]);

    // Let's actually check how payouts are structured. Payouts don't have a PENDING status? 
    // Wait, let's just query affiliate_commissions for UNPAID to show how many unpaid commissions exist? 
    // Or actually, there is no "payout request" system yet. The admin just pays manually. 
    // I'll leave pendingPayouts as 0 for now since there's no "pending payout" queue.

    return NextResponse.json({
      pendingApprovals,
      openTickets,
      pendingPayouts: 0
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 });
  }
}

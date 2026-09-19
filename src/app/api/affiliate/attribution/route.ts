import { NextResponse } from "next/server";
import clientPromise from "@/lib/db/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { assertSameOrigin } from "@/lib/route-guard";
import { createInAppNotification } from "@/lib/notifications";

/**
 * First-touch attribution binding (01 §12.3): called once after signup when
 * the user arrives with ?ref=CODE. Registration-only; checkout codes are
 * inert. Unique (referredUserId) = first touch wins, later binds ignored.
 */
export async function POST(req: Request) {
  try {
    const csrf = assertSameOrigin(req);
    if (csrf) return csrf;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me = session.user.publicUserId as string;

    let rawCode: unknown;
    try {
      rawCode = (await req.json())?.code;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const clean = String(rawCode ?? "").trim().toUpperCase();
    if (!/^[A-Z0-9]{4,32}$/.test(clean)) {
      return NextResponse.json({ error: "Missing code." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Already attributed? First touch is immutable — keep it, don't error.
    const existing = await db.collection("affiliate_referrals").findOne({ referredUserId: me });
    if (existing) return NextResponse.json({ success: true, bound: false, reason: "already-attributed" });

    const codeRow = await db.collection("affiliate_codes").findOne({ code: clean });
    // Unknown vs inactive codes are indistinguishable to non-owners (no oracle).
    if (!codeRow || codeRow.status !== "ACTIVE") {
      return NextResponse.json({ success: true, bound: false, reason: "unknown-or-inactive" });
    }
    const affiliateId = String(codeRow.affiliateId);
    if (affiliateId === me) {
      return NextResponse.json({ success: true, bound: false, reason: "self-referral" });
    }
    const profile = await db.collection("affiliate_profiles").findOne({ userId: affiliateId });
    if (!profile || profile.status !== "ACTIVE") {
      return NextResponse.json({ success: true, bound: false, reason: "unknown-or-inactive" });
    }

    try {
      await db.collection("affiliate_referrals").insertOne({
        referredUserId: me,
        affiliateId,
        codeUsed: clean,
        createdAt: new Date(),
      });
    } catch {
      // Lost the race with a concurrent bind — first touch won elsewhere.
      return NextResponse.json({ success: true, bound: false, reason: "already-attributed" });
    }
    // Notify the referrer (best-effort — bind already committed).
    createInAppNotification(
      affiliateId,
      "AFFILIATE_REFERRAL",
      "New referral",
      `A new user signed up with your code ${clean}.`,
    ).catch(() => {});
    return NextResponse.json({ success: true, bound: true });
  } catch (error) {
    console.error("POST /api/affiliate/attribution Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

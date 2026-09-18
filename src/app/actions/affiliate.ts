"use server";

import { auth } from "@/lib/auth";
import clientPromise from "@/lib/db/mongodb";
import { headers } from "next/headers";

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("UNAUTHORIZED");
  if ((session.user as unknown as { status?: string }).status !== "ACTIVE") {
    throw new Error("Account is not active.");
  }
  return session.user;
}

function isPartner(user: unknown): boolean {
  return ((user as { capabilities?: string[] }).capabilities ?? []).includes("CAPABILITY_AFFILIATE");
}

/** Own partner dashboard data: profile + codes + commissions + balances. */
export async function getMyAffiliate() {
  const me = await requireUser();
  if (!isPartner(me)) return { partner: false as const };
  const myId = me.publicUserId as string;
  const client = await clientPromise;
  const db = client.db();
  const [codes, commissions, payouts] = await Promise.all([
    db.collection("affiliate_codes").find({ affiliateId: myId }).sort({ createdAt: -1 }).toArray(),
    db.collection("affiliate_commissions").find({ affiliateId: myId }).sort({ createdAt: -1 }).limit(200).toArray(),
    db.collection("affiliate_payouts").find({ affiliateId: myId }).sort({ createdAt: -1 }).limit(100).toArray(),
  ]);
  const earned = commissions.reduce((s, c) => s + (Number(c.finalCommissionBdt) || 0), 0);
  const paid = payouts.reduce((s, p) => s + (Number(p.amountBdt) || 0), 0);
  const str = (d: Record<string, unknown>) => ({ ...d, _id: String(d._id) });
  return {
    partner: true as const,
    codes: codes.map(str),
    commissions: commissions.map(str),
    payouts: payouts.map(str),
    earned,
    paid,
    unpaid: earned - paid,
  };
}

/**
 * Create a referral code (≤8 chars, throttled 3/day, capped at
 * affiliateMaxActiveCodes ACTIVE — all enforced atomically-ish server-side).
 */
export async function createAffiliateCode(code: string) {
  const me = await requireUser();
  if (!isPartner(me)) throw new Error("Partner access only.");
  const clean = String(code ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length < 3 || clean.length > 8) throw new Error("Code needs 3–8 letters/digits.");
  const myId = me.publicUserId as string;
  const client = await clientPromise;
  const db = client.db();

  // 3-new-codes/day throttle.
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);
  const recent = await db.collection("affiliate_codes").countDocuments({
    affiliateId: myId,
    createdAt: { $gte: dayAgo },
  });
  if (recent >= 3) throw new Error("Code creation throttled: max 3 new codes per day.");

  // Active-code cap (default 5).
  const settings = await db.collection("system_settings").findOne({ _id: "GLOBAL_SETTINGS" } as never).catch(() => null);
  const cap = Number(settings?.affiliateMaxActiveCodes ?? 5);
  const active = await db.collection("affiliate_codes").countDocuments({ affiliateId: myId, status: "ACTIVE" });
  if (active >= cap) throw new Error(`Active code limit reached (${cap}). Disable one first.`);

  try {
    await db.collection("affiliate_codes").insertOne({
      code: clean,
      affiliateId: myId,
      status: "ACTIVE",
      createdAt: new Date(),
    });
  } catch {
    throw new Error("Code taken — pick another.");
  }
  return { success: true, code: clean };
}

/** Disable a code (terminal: no reactivation, no reuse, history kept). */
export async function disableAffiliateCode(code: string) {
  const me = await requireUser();
  if (!isPartner(me)) throw new Error("Partner access only.");
  const myId = me.publicUserId as string;
  const client = await clientPromise;
  const res = await client.db().collection("affiliate_codes").updateOne(
    { code: String(code).toUpperCase(), affiliateId: myId, status: "ACTIVE" },
    { $set: { status: "DISABLED" } },
  );
  if (res.matchedCount === 0) throw new Error("Code not found or already disabled.");
  return { success: true };
}

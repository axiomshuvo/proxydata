"use server";

import { auth } from "@/lib/auth";
import clientPromise from "@/lib/db/mongodb";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ObjectId, type Db } from "mongodb";
import { randomBytes } from "crypto";
import { ApprovalAbort, claimCouponTx, decideCommission } from "@/lib/approval";
import {
  addSubUserBalance,
  createSubUser,
  getAdditionHistory,
  getResellerBalance,
  getSubUserBalance,
  setSubUserStatus,
} from "@/lib/dataimpulse/client";
import { createInAppNotification } from "@/lib/notifications";
import { PlanSchema } from "@/lib/db/schema";
import {
  loadWholesaleCosts,
  quoteTiered,
  validateTiers,
  type WholesaleCostMap,
} from "@/lib/pricing";

const BYTES_PER_GB = 1073741824;

/**
 * Security wrapper to ensure ONLY the admin can run these actions.
 */
async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session || session.user.role !== "ROLE_ADMIN") {
    throw new Error("UNAUTHORIZED: Only admins can perform this action.");
  }
  
  return session.user;
}

/**
 * NoSQL-injection guard: Server Action args cross the network as tampered
 * payloads (TS types don't survive). Every external ID must collapse to a
 * plain non-empty string before entering a Mongo filter — objects like
 * {"$ne": null} would otherwise act as query operators.
 */
function asId(value: unknown, label = "ID"): string {
  const s = String(value ?? "").trim();
  if (!s || s.startsWith("$") || s.includes("\0")) throw new Error(`${label} is not valid.`);
  return s;
}

/** Same guard for ObjectId-typed params (throws cleanly instead of 500). */
function asObjectId(value: unknown, label = "ID"): ObjectId {
  const s = asId(value, label);
  if (!ObjectId.isValid(s)) throw new Error(`${label} is not valid.`);
  return new ObjectId(s);
}

const USER_STATUSES = ["ACTIVE", "SUSPENDED", "DEACTIVATED"] as const;

/**
 * Get all users for the Admin Table
 */
export async function getAllUsers() {
  await requireAdmin();
  const client = await clientPromise;
  const db = client.db();
  
  // Fetch users, omitting sensitive BetterAuth fields if any
  const users = await db.collection("user").find({}).sort({ createdAt: -1 }).toArray();
  
  // Convert MongoDB ObjectIds to strings for Next.js Client Components
  return users.map(user => ({
    ...user,
    _id: user._id.toString(),
  }));
}

/**
 * Get the full "God-Mode" details for a single user:
 * identity + proxy inventory + ledger + partner data + audit trail.
 * Passwords are stripped (masked display only, never the secret).
 */
export async function getUserDetails(publicUserId: string) {
  await requireAdmin();
  const safeId = asId(publicUserId, "publicUserId");
  const client = await clientPromise;
  const db = client.db();

  // 1. Get Base User Identity
  const user = await db.collection("user").findOne({ publicUserId: safeId });
  if (!user) throw new Error("User not found");
  const uid = user._id.toString();
  const idKeys = [safeId, uid];

  // 2. Get Proxy Inventory (All their proxy accounts)
  const proxyAccounts = await db.collection("proxy_accounts").find({ userId: { $in: idKeys } }).toArray();

  // 3. Get Financial Transactions
  const transactions = await db.collection("transactions")
    .find({ userId: { $in: idKeys } })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  // 4. Get Notification History (Admin Audit)
  const notifications = await db.collection("notifications")
    .find({ userId: { $in: idKeys } })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  // 4. Partner data (only meaningful for invited affiliates, harmless otherwise)
  const [affiliateProfile, affiliateCodes, commissions, payouts, referral] = await Promise.all([
    db.collection("affiliate_profiles").findOne({ userId: { $in: idKeys } }),
    db.collection("affiliate_codes").find({ affiliateId: { $in: idKeys } }).toArray(),
    db.collection("affiliate_commissions").find({ affiliateId: { $in: idKeys } }).sort({ createdAt: -1 }).limit(200).toArray(),
    db.collection("affiliate_payouts").find({ affiliateId: { $in: idKeys } }).sort({ createdAt: -1 }).limit(100).toArray(),
    db.collection("affiliate_referrals").findOne({ referredUserId: { $in: idKeys } }),
  ]);

  // 5. Audit trail touching this user
  const audit = await db.collection("audit_logs")
    .find({ targetId: { $in: idKeys } })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  const str = (doc: Record<string, unknown>) => ({ ...doc, _id: String(doc._id) });
  const safeAccounts = proxyAccounts.map((p) => {
    const { password: _secret, ...safe } = p as Record<string, unknown>;
    return { ...str(safe), hasPassword: true };
  });

  return {
    user: { ...user, _id: uid },
    proxyAccounts: safeAccounts,
    transactions: transactions.map(str),
    affiliate: affiliateProfile
      ? {
          ...str(affiliateProfile as Record<string, unknown>),
          codes: affiliateCodes.map(str),
          commissions: commissions.map(str),
          payouts: payouts.map(str),
        }
      : null,
    referredBy: referral ? str(referral as Record<string, unknown>) : null,
    audit: audit.map(str),
  };
}

/**
 * Suspend / restore / deactivate a user — FAIL-CLOSED per 01 §9.3.
 * Order for suspend/deactivate: (1) set-blocked=true on ALL provider
 * sub-users, (2) delete all Better Auth sessions + expire cookies,
 * (3) flip users.status, (4) audit row. Step (3) MUST NOT run if (1)
 * is unconfirmed. Restore reverses (DB first, then unblock).
 */
export async function updateUserStatus(publicUserId: string, newStatus: "ACTIVE" | "SUSPENDED" | "DEACTIVATED") {
  const admin = await requireAdmin();
  const safeId = asId(publicUserId, "publicUserId");
  if (!(USER_STATUSES as readonly string[]).includes(newStatus)) {
    throw new Error("Invalid status.");
  }
  const client = await clientPromise;
  const db = client.db();

  const user = await db.collection("user").findOne({ publicUserId: safeId });
  if (!user) throw new Error("User not found");

  const blocking = newStatus === "SUSPENDED" || newStatus === "DEACTIVATED";

  if (blocking) {
    // (1) Block ALL provider sub-users FIRST — never flip DB before confirm.
    const accounts = await db
      .collection("proxy_accounts")
      .find({ userId: { $in: [user._id.toString(), safeId] } })
      .toArray();
    for (const acc of accounts) {
      const subId = Number(acc.providerSubUserId ?? acc.providerSubId);
      if (!Number.isFinite(subId)) continue;
      await setSubUserStatus(subId, true);
      await db.collection("provider_operation_logs").insertOne({
        transactionId: `admin:${safeId}`,
        operationType: "SET_BLOCKED",
        provider: "dataimpulse",
        payload: { subuser_id: subId, blocked: true },
        status: "SUCCESS",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    // (2) Revoke every Better Auth session row (cookies expire client-side on next guard hit).
    await db.collection("session").deleteMany({ userId: user._id.toString() });
    await db.collection("sessions").deleteMany({ userId: user._id.toString() });
  }

  // (3) Flip status only after provider confirms (or immediately on restore).
  await db.collection("user").updateOne(
    { publicUserId: safeId },
    { $set: { status: newStatus, updatedAt: new Date() } }
  );

  if (!blocking) {
    const accounts = await db
      .collection("proxy_accounts")
      .find({ userId: { $in: [user._id.toString(), safeId] } })
      .toArray();
    for (const acc of accounts) {
      const subId = Number(acc.providerSubUserId ?? acc.providerSubId);
      if (!Number.isFinite(subId)) continue;
      await setSubUserStatus(subId, false);
    }
  }

  // (4) Redacted audit row (no passwords, tokens, or full TrxIDs).
  await db.collection("audit_logs").insertOne({
    actorId: admin.id ?? admin.email ?? "admin",
    actorRole: "ROLE_ADMIN",
    action: blocking ? "USER_SUSPENDED" : "USER_RESTORED",
    targetType: "USER",
    targetId: safeId,
    metadata: { newStatus },
    createdAt: new Date(),
  });
  
  // (5) Notify the user
  const { createInAppNotification: notify } = await import("@/lib/notifications");
  await notify(
    safeId,
    blocking ? "ACCOUNT_SUSPENDED" : "ACCOUNT_RESTORED",
    blocking ? "Account Suspended" : "Account Restored",
    blocking ? "Your account has been suspended by an administrator." : "Your account access has been restored."
  );

  return { success: true, status: newStatus };
}


/**
 * Phase 10: Admin Stats — on-the-fly aggregates under 100k txns (02 §45).
 * Revenue sums finalAmountBdt on terminal ACTIVE purchases only.
 */
export async function getAdminStats() {
  await requireAdmin();
  const client = await clientPromise;
  const db = client.db();

  const [totalUsers, pendingTxCount, completedTxns] = await Promise.all([
    db.collection("user").countDocuments(),
    db.collection("transactions").countDocuments({ status: "PENDING" }),
    db.collection("transactions").find({ status: "ACTIVE", type: "PURCHASE" }).toArray()
  ]);

  const totalRevenue = completedTxns.reduce((sum, tx) => sum + (tx.finalAmountBdt || 0), 0);

  return {
    totalUsers,
    pendingTxCount,
    totalRevenue
  };
}

/**
 * Phase 10: Get Pending Transactions
 */
export async function getPendingTransactions() {
  await requireAdmin();
  const client = await clientPromise;
  const db = client.db();

  const txns = await db.collection("transactions")
    .find({ status: "PENDING" })
    .sort({ createdAt: -1 })
    .toArray();

  return txns.map(tx => ({ ...tx, _id: tx._id.toString() }));
}

/**
 * Phase 10: Approve Transaction — LOCKED machine 01 §16.2:
 * PENDING → APPROVED → ALLOCATING → PROVIDER_VERIFIED → ACTIVE.
 * Idempotency key = transactionId (provider_operation_logs unique key);
 * before ANY resend, reconcile via balance/get + addition-history.
 * Coupon claim (atomic, 01 §15.3) + commission decision (incl. explicit ৳0,
 * 01 §12.4) are part of this pipeline — see claimCouponTx/decideCommission.
 * Never invents statuses; never calls DataImpulse without an op-log row first.
 */

const GB_BYTES = 1073741824;
export async function approveTransaction(transactionId: string) {
  const admin = await requireAdmin();
  const txOid = asObjectId(transactionId, "transactionId");
  const client = await clientPromise;
  const db = client.db();

  // 1. PENDING → APPROVED (status-precondition; concurrent approvers: one wins).
  const approved = await db.collection("transactions").findOneAndUpdate(
    { _id: txOid, status: "PENDING" },
    { $set: { status: "APPROVED", approvedAt: new Date(), updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  const tx = approved;
  if (!tx) {
    throw new Error("Transaction is not PENDING or does not exist.");
  }

  // Idempotency: same transactionId + operationType can only run once.
  const opKey = { transactionId: tx.transactionId ?? transactionId, operationType: "ADD_BALANCE" as const };
  const existingOp = await db.collection("provider_operation_logs").findOne(opKey);
  if (existingOp?.status === "SUCCESS") {
    return { success: true, deduped: true };
  }

  try {
    const bandwidthGb = Number(tx.bandwidthGb ?? tx.planGbSnapshot ?? 0);
    if (!Number.isInteger(bandwidthGb) || bandwidthGb < 1) {
      throw new Error("Transaction has no valid integer bandwidthGb.");
    }
    const proxyType = tx.proxyType ?? "RESIDENTIAL";
    const poolType = String(proxyType).toLowerCase() as "residential" | "mobile" | "datacenter" | "premium_residential";

    // 1b. Price/stock re-validation (01 §14.1/§16.2): plan still ACTIVE, tier
    // still covers the quantity at the same rate, stock sufficient. ANY drift
    // aborts back to PENDING with a re-confirm event — never a silent recharge.
    // Stock uses a LIVE upstream read (not the 60s display cache): the cached
    // flag is advisory, this gate is authoritative.
    if (tx.planId) {
      const abortToPending = async (why: string): Promise<never> => {
        await db.collection("transactions").updateOne(
          { _id: tx._id, status: "APPROVED" },
          { $set: { status: "PENDING", approvedAt: null, updatedAt: new Date() } },
        );
        await createInAppNotification(
          tx.userId,
          "PURCHASE_CANCELLED",
          "Order needs re-confirmation",
          why,
        );
        throw new ApprovalAbort(`Approval aborted back to PENDING: ${why}`);
      };
      try {
        const plan = await db.collection("plans").findOne({ _id: new ObjectId(tx.planId) });
        if (!plan || plan.status !== "ACTIVE") throw new Error("Plan no longer ACTIVE.");
        // Provider gate: orders placed before a pause must not allocate after
        // it — back to PENDING until the provider returns (all modes).
        const billing = await loadProviderBilling(db, plan.providerId ?? "dataimpulse");
        if (billing.status !== "ACTIVE") {
          await abortToPending("This plan's provider is paused — approval on hold until it returns.");
        }
        if (plan.pricingMode === "TIERED") {
          const quote = quoteTiered(plan.tiers ?? [], plan.proxyType, bandwidthGb, {
            RESIDENTIAL: billing.baseBdt,
            MOBILE: billing.baseBdt,
            DATACENTER: billing.baseBdt,
            PREMIUM_RESIDENTIAL: billing.baseBdt,
          }, billing.coefficients);
          if (quote.subtotalBdt !== tx.basePriceBdt || quote.unitRateBdt !== (tx.unitRateBdt ?? quote.unitRateBdt)) {
            throw new Error("Tier price changed since submission.");
          }
        } else if (plan.retailPriceBdt !== tx.basePriceBdt) {
          throw new Error("Plan price changed since submission.");
        }
        // Live stock gate (dataimpulse only — other providers report unknown).
        // Unreachable upstream aborts gracefully (retry later) — it must NOT
        // look like insufficient stock and must NOT consume coupon capacity,
        // so the claim below runs only after this gate passes.
        if ((plan.providerId ?? "dataimpulse") === "dataimpulse") {
          const billing = await loadProviderBilling(db, "dataimpulse");
          const need = bandwidthGb * (billing.coefficients[proxyType] ?? 1);
          let live: number;
          try {
            live = await getResellerBalance();
          } catch {
            await abortToPending("Provider is unreachable — nothing was allocated. Please retry shortly.");
          }
          if (need! > live!) {
            await abortToPending(`Insufficient upstream stock for ${bandwidthGb} GB ${proxyType} — please try a smaller amount.`);
          }
        }
        // Coupon atomic claim (01 §15.3) — winning code only, inside the
        // approval window. Any failure aborts back to PENDING.
        await claimCouponTx(db, tx as unknown as Record<string, any>, abortToPending);
      } catch (drift) {
        if (drift instanceof ApprovalAbort) throw drift;
        const msg = drift instanceof Error ? drift.message : String(drift);
        await db.collection("transactions").updateOne(
          { _id: tx._id, status: "APPROVED" },
          { $set: { status: "PENDING", approvedAt: null, updatedAt: new Date() } },
        );
        await createInAppNotification(
          tx.userId,
          "PURCHASE_CANCELLED",
          "Price changed — please re-confirm",
          "This order's price changed since you submitted it. Please review and resubmit.",
        );
        throw new ApprovalAbort(`Price drift — approval aborted back to PENDING: ${msg}`);
      }
    }

    // 2. APPROVED → ALLOCATING (worker step, single-flight per transactionId).
    // Pin the coefficient-adjusted provider cost into the snapshot here
    // (01 §10.2: ceil(gb × poolCoeff × filterMult × wholesale)).
    const costBilling = await loadProviderBilling(db, tx.providerId ?? "dataimpulse");
    const poolCoeff = costBilling.coefficients[proxyType] ?? 1;
    const providerCostBdt = Math.ceil(bandwidthGb * poolCoeff * 1 * costBilling.baseBdt);
    const allocating = await db.collection("transactions").findOneAndUpdate(
      { _id: tx._id, status: "APPROVED" },
      { $set: { status: "ALLOCATING", providerCostBdt, poolCoefficient: poolCoeff, filterMultiplier: 1, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!allocating) throw new Error("Transaction left APPROVED before worker started.");

    // 3. Fetch or create the ONE proxy_account for (user, provider, proxyType).
    let proxyAccount = await db.collection("proxy_accounts").findOne({
      userId: tx.userId,
      providerId: "dataimpulse",
      proxyType,
    });
    // Fallback for legacy rows keyed by publicUserId string variants.
    proxyAccount ??= await db.collection("proxy_accounts").findOne({
      providerId: "dataimpulse",
      proxyType,
    });

    let subUserId: number | null = proxyAccount
      ? Number(proxyAccount.providerSubUserId ?? proxyAccount.providerSubId)
      : null;

    if (!proxyAccount || !Number.isFinite(subUserId)) {
      const created = await createSubUser({
        label: `px-${String(tx.userId).slice(-6)}-${poolType}`,
        poolType,
      });
      subUserId = Number(created.id);
      await db.collection("proxy_accounts").insertOne({
        userId: tx.userId,
        providerId: "dataimpulse",
        providerSubUserId: subUserId,
        proxyType,
        poolTypeRaw: poolType,
        login: created.login,
        // NOTE: encrypt with AES-256-GCM before ANY write (02 §43) — rotation
        // helper lands with the credentials-rotation step; never log plaintext.
        password: created.password,
        cumulativePurchasedBytes: 0,
        cachedRemainingBytes: 0,
        lastBalanceSyncAt: new Date(),
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await db.collection("provider_operation_logs").insertOne({
        ...opKey,
        provider: "dataimpulse",
        payload: { pool_type: poolType },
        status: "SUCCESS",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 4. Pre-call balance snapshot + op-log PENDING row (retry evidence, 02 §51).
    const pre = await getSubUserBalance(subUserId!);
    const preTotal: number = pre.balance_total ?? pre.balance ?? 0;
    try {
      await db.collection("provider_operation_logs").insertOne({
        ...opKey,
        provider: "dataimpulse",
        payload: { subuser_id: subUserId, traffic: bandwidthGb },
        preCallBalanceBytes: preTotal,
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch {
      // Duplicate key = concurrent worker already handling it; bail out safely.
      return { success: true, deduped: true };
    }

    // 5. Allocate upstream (NOT idempotent upstream — guarded by the op-log key).
    await addSubUserBalance(subUserId!, bandwidthGb);

    // 6. Confirm via authoritative balance/get (+ addition-history evidence).
    const post = await getSubUserBalance(subUserId!);
    const postTotal: number = post.balance_total ?? post.balance ?? 0;
    const history = await getAdditionHistory(subUserId!).catch(() => null);
    const lastAdd = history?.history?.[history.history.length - 1];
    await db.collection("provider_operation_logs").updateOne(opKey, {
      $set: {
        status: "SUCCESS",
        response: {
          preTotal,
          postTotal,
          traffic_added: lastAdd?.traffic_added ?? null,
          balance_charged: lastAdd?.balance_charged ?? null,
        },
        updatedAt: new Date(),
      },
    });

    // 7. ALLOCATING → PROVIDER_VERIFIED → ACTIVE (+ reporting cache bump).
    await db.collection("transactions").updateOne(
      { _id: tx._id, status: "ALLOCATING" },
      { $set: { status: "PROVIDER_VERIFIED", updatedAt: new Date() } },
    );
    // Commission decision (incl. explicit ৳0) lands in the same step as
    // PROVIDER_VERIFIED → ACTIVE (01 §12.4). Idempotent per transactionId.
    await decideCommission(db, tx as unknown as Record<string, any>, providerCostBdt);
    await db.collection("transactions").updateOne(
      { _id: tx._id, status: "PROVIDER_VERIFIED" },
      {
        $set: {
          status: "ACTIVE",
          activatedAt: new Date(),
          updatedAt: new Date(),
          trafficAddedGb: bandwidthGb,
        },
      },
    );
    await db.collection("proxy_accounts").updateOne(
      { userId: tx.userId, providerId: "dataimpulse", proxyType },
      {
        $inc: { cumulativePurchasedBytes: bandwidthGb * BYTES_PER_GB },
        $set: {
          cachedRemainingBytes: post.balance ?? postTotal,
          cachedTotalBytes: postTotal,
          lastBalanceSyncAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    await db.collection("audit_logs").insertOne({
      actorId: admin.id ?? admin.email ?? "admin",
      actorRole: "ROLE_ADMIN",
      action: "PURCHASE_APPROVED",
      targetType: "TRANSACTION",
      targetId: tx.transactionId ?? transactionId,
      metadata: { bandwidthGb, proxyType },
      createdAt: new Date(),
    });

    // Phase 11: In-App Notification (Purchase Approved — locked type).
    await createInAppNotification(
      tx.userId,
      "PURCHASE_APPROVED",
      "Payment approved",
      `Your payment was approved. ${bandwidthGb} GB has been allocated to your proxy.`,
    );

    return { success: true };
  } catch (error) {
    // Graceful aborts (drift / exhausted coupon / unreachable provider) already
    // parked the order back in PENDING with a user notice — pass through
    // untouched. Only real provider failures land in FAILED.
    if (error instanceof ApprovalAbort) throw error;
    console.error("Approval failed:", error);
    // Fail-closed: hold in FAILED with evidence — never silently back to PENDING,
    // never forward to ACTIVE. Admin retries via FAILED → ALLOCATING with the
    // SAME idempotency key after checking live balance (stale-ALLOCATING sweeper).
    await db.collection("provider_operation_logs").updateOne(opKey, {
      $set: { status: "FAILED", updatedAt: new Date() },
    });
    await db.collection("transactions").updateOne(
      { _id: tx._id },
      { $set: { status: "FAILED", updatedAt: new Date() } },
    );
    const { logRuntime } = await import("@/lib/runtime-log");
    logRuntime({
      level: "ERROR",
      source: "admin",
      provider: "dataimpulse",
      operation: "APPROVE_TRANSACTION",
      status: "FAILED",
      message: `Approval failed for ${tx.transactionId ?? transactionId} — held in FAILED.`,
      refId: tx.transactionId ?? transactionId,
    });
    throw new Error("Upstream allocation failed. Transaction held in FAILED for reconciliation.");
  }
}

/* ------------------------------------------------------------------ */
/* Plans (FIXED bundles + TIERED flex)                                 */
/* (Buying costs live on the Providers registry — see saveProvider.)   */
/* ------------------------------------------------------------------ */

/** All plans for the admin table (any status). */
export async function getPlansAdmin() {
  await requireAdmin();
  const client = await clientPromise;
  const plans = await client.db().collection("plans").find({}).sort({ proxyType: 1, updatedAt: -1 }).toArray();
  return plans.map((p) => ({ ...p, _id: p._id.toString() }));
}

export interface PlanInput {
  name: string;
  providerId?: string; // defaults to "dataimpulse"; must be ACTIVE (or unchanged on edit)
  proxyType: "RESIDENTIAL" | "MOBILE" | "DATACENTER" | "PREMIUM_RESIDENTIAL";
  pricingMode: "FIXED" | "TIERED";
  bandwidthGb?: number;
  retailPriceBdt?: number;
  tiers?: { minGb: number; maxGb: number | null; pricePerGbBdt: number }[];
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  validityDays?: number;
  expiryAction?: "BLOCK" | "BLOCK_AND_RECLAIM";
}

import type { ProviderBilling } from "@/lib/pricing";
import { floorForProvider } from "@/lib/pricing";

function buildPlanDoc(
  input: PlanInput,
  billing: ProviderBilling,
  opts?: { allowInactiveProvider?: boolean },
) {
  const mode = input.pricingMode;
  const name = String(input.name ?? "").trim();
  if (name.length < 3) throw new Error("Plan name needs at least 3 characters.");
  if (billing.status !== "ACTIVE" && !opts?.allowInactiveProvider)
    throw new Error(`Provider "${billing.name}" is not ACTIVE — activate it in Providers first.`);
  if (!billing.pools.includes(input.proxyType))
    throw new Error(`Provider "${billing.name}" does not sell ${input.proxyType}.`);
  const floor = floorForProvider(input.proxyType, billing);
  if (mode === "FIXED") {
    const gb = Number(input.bandwidthGb);
    const price = Number(input.retailPriceBdt);
    if (!Number.isInteger(gb) || gb < 1) throw new Error("Bundle needs integer GB ≥ 1.");
    if (!Number.isInteger(price) || price < 0) throw new Error("Price needs integer BDT ≥ 0.");
    if (floor > 0 && price < floor * gb)
      throw new Error(`BELOW_COST: ৳${price} is below buying cost ৳${floor * gb} (${gb} GB × ৳${floor}).`);
    return {
      name,
      providerId: billing.providerId,
      proxyType: input.proxyType,
      pricingMode: "FIXED" as const,
      bandwidthGb: gb,
      retailPriceBdt: price,
      tiers: [],
    };
  }
  const tiers = (input.tiers ?? []).map((t) => ({
    minGb: Number(t.minGb),
    maxGb: t.maxGb === null || t.maxGb === undefined ? null : Number(t.maxGb),
    pricePerGbBdt: Number(t.pricePerGbBdt),
  }));
  const check = validateTiers(tiers as never);
  if (!check.ok) throw new Error(check.error);
  if (floor > 0) {
    const bad = (tiers as { pricePerGbBdt: number }[]).find((t) => t.pricePerGbBdt < floor);
    if (bad) throw new Error(`BELOW_COST: tier ৳${bad.pricePerGbBdt}/GB is below buying cost ৳${floor}/GB.`);
  }
  return {
    name,
    providerId: billing.providerId,
    proxyType: input.proxyType,
    pricingMode: "TIERED" as const,
    bandwidthGb: 1,
    retailPriceBdt: tiers[0].pricePerGbBdt,
    tiers,
  };
}

export async function createPlan(input: PlanInput) {
  await requireAdmin();
  const client = await clientPromise;
  const billing = await loadProviderBilling(client.db(), input.providerId ?? "dataimpulse");
  const doc = buildPlanDoc(input, billing);
  const parsed = PlanSchema.safeParse({ ...doc, status: input.status ?? "ACTIVE", createdAt: new Date(), updatedAt: new Date() });
  if (!parsed.success) throw new Error("Invalid plan: " + parsed.error.issues[0]?.message);
  const { _id: _omit, ...planDoc } = parsed.data;
  const res = await client.db().collection("plans").insertOne({
    ...planDoc,
    validityDays: input.validityDays,
    expiryAction: input.expiryAction ?? "BLOCK",
  });
  await client.db().collection("audit_logs").insertOne({
    actorId: "admin",
    actorRole: "ROLE_ADMIN",
    action: "PLAN_CREATED",
    targetType: "PLAN",
    targetId: res.insertedId.toString(),
    metadata: { name: doc.name, pricingMode: doc.pricingMode },
    createdAt: new Date(),
  });
  revalidatePath("/plans"); // catalog cache purges instantly on every plan write
  return { success: true, id: res.insertedId.toString() };
}

export async function updatePlan(id: string, input: PlanInput) {
  await requireAdmin();
  const planOid = asObjectId(id, "planId");
  const client = await clientPromise;
  const existing = await client.db().collection("plans").findOne({ _id: planOid });
  if (!existing) throw new Error("Plan not found.");
  const providerId = input.providerId ?? existing.providerId ?? "dataimpulse";
  const billing = await loadProviderBilling(client.db(), providerId);
  // Editing a plan whose provider went inactive is allowed only if the
  // provider stays the same (e.g. archiving); switching requires ACTIVE.
  const doc = buildPlanDoc(input, billing, {
    allowInactiveProvider: providerId === existing.providerId,
  });
  if (existing.status === "ARCHIVED" && (input.status ?? "ARCHIVED") !== "ARCHIVED")
    throw new Error("ARCHIVED plans stay archived (history refs) — create a new plan instead.");
  await client.db().collection("plans").updateOne(
    { _id: planOid },
    {
      $set: {
        ...doc,
        status: input.status ?? existing.status,
        validityDays: input.validityDays ?? existing.validityDays,
        expiryAction: input.expiryAction ?? existing.expiryAction ?? "BLOCK",
        updatedAt: new Date(),
      },
    },
  );
  await client.db().collection("audit_logs").insertOne({
    actorId: "admin",
    actorRole: "ROLE_ADMIN",
    action: "PLAN_MODIFIED",
    targetType: "PLAN",
    targetId: id,
    metadata: { name: doc.name },
    createdAt: new Date(),
  });
  revalidatePath("/plans"); // catalog cache purges instantly on every plan write
  return { success: true };
}

/* ------------------------------------------------------------------ */
/* Providers registry (multi-provider foundation)                      */
/* ------------------------------------------------------------------ */

import { ProviderDocSchema } from "@/lib/db/schema";
import { loadProviderBilling, POOL_COEFFICIENTS } from "@/lib/pricing";

const DATAIMPULSE_DEFAULTS = {
  providerId: "dataimpulse",
  name: "DataImpulse",
  status: "ACTIVE" as const,
  pools: ["RESIDENTIAL", "MOBILE", "DATACENTER", "PREMIUM_RESIDENTIAL"] as const,
  coefficients: { ...POOL_COEFFICIENTS },
  gateway: { host: "gw.dataimpulse.com", httpPort: 823, socks5Port: 824 },
};

/** Ensure the DataImpulse row exists (preserves any saved buying cost). */
async function ensureDataImpulse() {
  const client = await clientPromise;
  const existing = await client.db().collection("providers").findOne({ providerId: "dataimpulse" });
  if (!existing) {
    await client.db().collection("providers").insertOne({
      ...DATAIMPULSE_DEFAULTS,
      pools: [...DATAIMPULSE_DEFAULTS.pools],
      wholesaleBaseBdt: 0,
      costPerGbBdt: { RESIDENTIAL: 0, MOBILE: 0, DATACENTER: 0, PREMIUM_RESIDENTIAL: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } else {
    // Backfill new registry fields on rows created by older builds.
    await client.db().collection("providers").updateOne(
      { providerId: "dataimpulse" },
      {
        $set: {
          name: existing.name ?? "DataImpulse",
          status: existing.status ?? "ACTIVE",
          pools: existing.pools ?? [...DATAIMPULSE_DEFAULTS.pools],
          coefficients: existing.coefficients ?? { ...POOL_COEFFICIENTS },
          gateway: existing.gateway ?? { ...DATAIMPULSE_DEFAULTS.gateway },
          updatedAt: new Date(),
        },
      },
    );
  }
}

/** All providers for the admin registry (DataImpulse auto-seeded). */
export async function getProvidersAdmin() {
  await requireAdmin();
  await ensureDataImpulse();
  const client = await clientPromise;
  const rows = await client.db().collection("providers").find({}).sort({ providerId: 1 }).toArray();
  return rows.map((r) => ({ ...r, _id: r._id.toString() }));
}

export interface ProviderInput {
  providerId: string;
  name: string;
  status: "ACTIVE" | "MAINTENANCE" | "DISABLED";
  pools: ("RESIDENTIAL" | "MOBILE" | "DATACENTER" | "PREMIUM_RESIDENTIAL")[];
  wholesaleBaseBdt: number;
  coefficients: Record<string, number>;
  gateway: { host: string; httpPort: number; socks5Port: number };
}

export async function saveProvider(input: ProviderInput) {
  const admin = await requireAdmin();
  const client = await clientPromise;
  const id = String(input.providerId ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (id.length < 2) throw new Error("Provider ID needs at least 2 characters (a-z, 0-9, hyphen).");
  const name = String(input.name ?? "").trim();
  if (name.length < 2) throw new Error("Provider name needs at least 2 characters.");
  if (!Array.isArray(input.pools) || input.pools.length === 0)
    throw new Error("Pick at least one pool this provider sells.");
  const base = Number(input.wholesaleBaseBdt);
  if (!Number.isInteger(base) || base < 0) throw new Error("Buying cost must be an integer ≥ 0 BDT/GB.");
  const coefficients: Record<string, number> = {};
  for (const pool of input.pools) {
    const c = Number(input.coefficients?.[pool]);
    if (!Number.isFinite(c) || c <= 0) throw new Error(`${pool}: coefficient must be a number > 0.`);
    coefficients[pool] = c;
  }
  const gateway = {
    host: String(input.gateway?.host ?? "").trim() || "gw.dataimpulse.com",
    httpPort: Number(input.gateway?.httpPort) || 823,
    socks5Port: Number(input.gateway?.socks5Port) || 824,
  };
  const parsed = ProviderDocSchema.safeParse({
    providerId: id,
    name,
    status: input.status,
    pools: input.pools,
    wholesaleBaseBdt: base,
    coefficients,
    gateway,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  if (!parsed.success) throw new Error("Invalid provider: " + parsed.error.issues[0]?.message);
  // Strip immutable fields: _id never writes through, and createdAt lives
  // ONLY in $setOnInsert — leaving it in $set throws "Updating the path
  // 'createdAt' would create a conflict at 'createdAt'" on every save.
  const { _id: _omit, createdAt: _created, ...doc } = parsed.data;
  await client.db().collection("providers").updateOne(
    { providerId: id },
    { $set: { ...doc, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
  await client.db().collection("audit_logs").insertOne({
    actorId: admin.id ?? admin.email ?? "admin",
    actorRole: "ROLE_ADMIN",
    action: "PROVIDER_SAVED",
    targetType: "PROVIDER",
    targetId: id,
    metadata: { name, status: input.status },
    createdAt: new Date(),
  });
  revalidatePath("/plans"); // provider status/cost/pools reshape the catalog
  return { success: true, providerId: id };
}

/** Live connection test — only DataImpulse has an adapter today. */
export async function testProviderConnection(providerId: string) {
  await requireAdmin();
  if (providerId !== "dataimpulse") {
    return { success: false, message: "No adapter wired for this provider yet (Coming Soon)." };
  }
  try {
    const { getResellerBalance } = await import("@/lib/dataimpulse/client");
    const balance = await getResellerBalance();
    return { success: true, message: `Connected — reseller balance ${balance} GB.` };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Connection failed." };
  }
}

/* ------------------------------------------------------------------ */
/* Reject (PENDING → REJECTED, reason required)                         */
/* ------------------------------------------------------------------ */

export async function rejectTransaction(transactionId: string, reason: string) {
  const admin = await requireAdmin();
  const clean = String(reason ?? "").trim();
  if (clean.length < 3) throw new Error("A reject reason is required (min 3 characters).");
  const txOid = asObjectId(transactionId, "transactionId");
  const client = await clientPromise;
  const db = client.db();
  const tx = await db.collection("transactions").findOneAndUpdate(
    { _id: txOid, status: "PENDING" },
    { $set: { status: "REJECTED", rejectReason: clean, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!tx) throw new Error("Transaction is not PENDING or does not exist.");
  await db.collection("audit_logs").insertOne({
    actorId: admin.id ?? admin.email ?? "admin",
    actorRole: "ROLE_ADMIN",
    action: "PURCHASE_REJECTED",
    targetType: "TRANSACTION",
    targetId: tx.transactionId ?? transactionId,
    metadata: { reason: clean },
    createdAt: new Date(),
  });
  await createInAppNotification(
    tx.userId,
    "PURCHASE_REJECTED",
    "Order rejected",
    `Your order was rejected: ${clean}`,
  );
  return { success: true };
}

/* ------------------------------------------------------------------ */
/* Affiliate capability grant / revoke (invite-only program)           */
/* ------------------------------------------------------------------ */

export async function setAffiliate(publicUserId: string, grant: boolean) {
  const admin = await requireAdmin();
  const safeId = asId(publicUserId, "publicUserId");
  if (typeof grant !== "boolean") throw new Error("Grant flag must be a boolean.");
  const client = await clientPromise;
  const db = client.db();
  const user = await db.collection("user").findOne({ publicUserId: safeId });
  if (!user) throw new Error("User not found.");
  const caps = new Set<string>(Array.isArray(user.capabilities) ? user.capabilities : []);
  if (grant) {
    caps.add("CAPABILITY_AFFILIATE");
    await db.collection("affiliate_profiles").updateOne(
      { userId: user._id.toString() },
      { $set: { userId: user._id.toString(), status: "ACTIVE" }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
  } else {
    caps.delete("CAPABILITY_AFFILIATE");
    // Profile row + codes + history are retained (attribution/audit spine).
  }
  await db.collection("user").updateOne(
    { publicUserId: safeId },
    { $set: { capabilities: [...caps], updatedAt: new Date() } },
  );
  await db.collection("audit_logs").insertOne({
    actorId: admin.id ?? admin.email ?? "admin",
    actorRole: "ROLE_ADMIN",
    action: grant ? "AFFILIATE_GRANTED" : "AFFILIATE_REVOKED",
    targetType: "USER",
    targetId: safeId,
    createdAt: new Date(),
  });
  return { success: true, affiliate: grant };
}

/* ------------------------------------------------------------------ */
/* Coupons (promo codes — separate from affiliate referral codes)      */
/* ------------------------------------------------------------------ */

export async function getCouponsAdmin() {
  await requireAdmin();
  const client = await clientPromise;
  const rows = await client.db().collection("coupons").find({}).sort({ createdAt: -1 }).toArray();
  return rows.map((r) => ({ ...r, _id: r._id.toString() }));
}

export interface CouponInput {
  code: string;
  type: "FIXED_AMOUNT" | "PERCENTAGE";
  value: number;
  maxDiscountAmount?: number;
  isOneTime?: boolean;
  usageLimit?: number;
  planId?: string;
  userEmail?: string;
  validFrom?: string;
  validTo?: string;
}

export async function createCoupon(input: CouponInput) {
  const admin = await requireAdmin();
  const code = String(input.code ?? "").trim().toUpperCase().replace(/[^A-Z0-9-_]/g, "");
  if (code.length < 3 || code.length > 32) throw new Error("Code needs 3–32 chars (A-Z, 0-9, -, _).");
  if (input.type !== "FIXED_AMOUNT" && input.type !== "PERCENTAGE") throw new Error("Bad discount type.");
  const value = Number(input.value);
  if (!Number.isFinite(value) || value <= 0) throw new Error("Value must be > 0.");
  if (input.type === "PERCENTAGE" && value > 100) throw new Error("Percentage cannot exceed 100.");
  const client = await clientPromise;
  const exists = await client.db().collection("coupons").findOne({ code });
  if (exists) throw new Error("Code already exists.");
  // Optional user bind, resolved server-side (fail closed on typo).
  let boundUserId: string | undefined;
  const email = String(input.userEmail ?? "").trim().toLowerCase();
  if (email) {
    const u = await client.db().collection("user").findOne({ email });
    if (!u) throw new Error(`No account with email ${email} — coupon left unbound? Clear the field to issue it open.`);
    boundUserId = String(u.publicUserId);
  }
  const doc = {
    code,
    status: "ACTIVE" as const,
    type: input.type,
    value,
    maxDiscountAmount: input.maxDiscountAmount !== undefined ? Number(input.maxDiscountAmount) : undefined,
    isOneTime: !!input.isOneTime,
    usageCount: 0,
    usageLimit: input.usageLimit !== undefined && input.usageLimit !== null ? Number(input.usageLimit) : undefined,
    planId: input.planId || undefined,
    userId: boundUserId,
    validFrom: input.validFrom ? new Date(input.validFrom) : undefined,
    validTo: input.validTo ? new Date(input.validTo) : undefined,
    createdAt: new Date(),
  };
  const res = await client.db().collection("coupons").insertOne(doc);
  await client.db().collection("audit_logs").insertOne({
    actorId: admin.id ?? admin.email ?? "admin",
    actorRole: "ROLE_ADMIN",
    action: "COUPON_CREATED",
    targetType: "COUPON",
    targetId: code,
    metadata: { type: input.type, value },
    createdAt: new Date(),
  });
  return { success: true, id: res.insertedId.toString(), code };
}

export async function setCouponStatus(code: string, status: "ACTIVE" | "INACTIVE") {
  await requireAdmin();
  if (status !== "ACTIVE" && status !== "INACTIVE") throw new Error("Invalid coupon status.");
  const client = await clientPromise;
  const res = await client.db().collection("coupons").updateOne(
    { code: String(code).toUpperCase() },
    { $set: { status } },
  );
  if (res.matchedCount === 0) throw new Error("Coupon not found.");
  return { success: true };
}

/** Append-only usage history for one coupon (who used it, on which order). */
export async function getCouponUsages(code: string) {
  await requireAdmin();
  const client = await clientPromise;
  const coupon = await client.db().collection("coupons").findOne({ code: String(code).toUpperCase() });
  if (!coupon) throw new Error("Coupon not found.");
  const rows = await client.db().collection("coupon_usages")
    .find({ couponId: coupon._id.toString() })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
  return rows.map((r) => ({ ...r, _id: r._id.toString() }));
}

/* ------------------------------------------------------------------ */
/* Affiliates overview + payouts + system settings                     */
/* ------------------------------------------------------------------ */

export async function getAffiliatesAdmin() {
  await requireAdmin();
  const client = await clientPromise;
  const db = client.db();
  const profiles = await db.collection("affiliate_profiles").find({}).sort({ createdAt: -1 }).toArray();
  const out = [];
  for (const p of profiles) {
    const uid = String(p.userId);
    const user = await db.collection("user").findOne({ publicUserId: uid });
    const [codes, commissions, payouts] = await Promise.all([
      db.collection("affiliate_codes").find({ affiliateId: { $in: [uid] } }).toArray(),
      db.collection("affiliate_commissions").find({ affiliateId: { $in: [uid] } }).toArray(),
      db.collection("affiliate_payouts").find({ affiliateId: { $in: [uid] } }).toArray(),
    ]);
    const earned = commissions.reduce((s, c) => s + (Number(c.finalCommissionBdt) || 0), 0);
    const paid = payouts.reduce((s, x) => s + (Number(x.amountBdt) || 0), 0);
    out.push({
      _id: String(p._id),
      userId: uid,
      email: (user?.email as string) ?? "—",
      status: p.status,
      activeCodes: codes.filter((c) => c.status === "ACTIVE").map((c) => String(c.code)),
      referrals: commissions.length,
      earned,
      paid,
      unpaid: earned - paid,
      createdAt: p.createdAt,
    });
  }
  return out;
}

/** Grant partner capability by email (admin invite path for existing accounts). */
export async function inviteAffiliateByEmail(email: string) {
  await requireAdmin();
  const clean = String(email ?? "").trim().toLowerCase();
  if (!clean.includes("@")) throw new Error("Enter a valid email.");
  const client = await clientPromise;
  const user = await client.db().collection("user").findOne({ email: clean });
  if (!user) throw new Error("No account with that email — they must register first.");
  return setAffiliate(String(user.publicUserId), true);
}

export async function getPayoutsAdmin() {
  await requireAdmin();
  const client = await clientPromise;
  const db = client.db();
  const affiliates = await getAffiliatesAdmin();
  const history = await db.collection("affiliate_payouts").find({}).sort({ createdAt: -1 }).limit(200).toArray();
  return {
    ledger: affiliates.filter((a) => a.unpaid > 0 || a.earned > 0),
    history: history.map((h) => ({ ...h, _id: String(h._id) })),
  };
}

export async function recordPayout(input: { affiliateUserId: string; amountBdt: number; reference: string; accountingPeriod?: string }) {
  const admin = await requireAdmin();
  const affiliateUserId = asId(input.affiliateUserId, "affiliateUserId");
  const amount = Number(input.amountBdt);
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("Amount must be an integer > 0 BDT.");
  const reference = String(input.reference ?? "").trim();
  if (reference.length < 3) throw new Error("A payment reference is required (e.g. bKash TrxID).");
  const periodRaw = String(input.accountingPeriod ?? "").trim();
  const accountingPeriod = periodRaw || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(accountingPeriod)) throw new Error("Accounting period must be YYYY-MM.");
  const client = await clientPromise;
  const db = client.db();
  // Overpay guard: recompute unpaid inside this flow; payout must not exceed it.
  const [commissions, payouts] = await Promise.all([
    db.collection("affiliate_commissions").find({ affiliateId: affiliateUserId }).toArray(),
    db.collection("affiliate_payouts").find({ affiliateId: affiliateUserId }).toArray(),
  ]);
  const earned = commissions.reduce((s, c) => s + (Number(c.finalCommissionBdt) || 0), 0);
  const paid = payouts.reduce((s, x) => s + (Number(x.amountBdt) || 0), 0);
  if (amount > earned - paid) throw new Error(`Overpay blocked: unpaid balance is ৳${earned - paid}.`);
  await db.collection("affiliate_payouts").insertOne({
    affiliateId: affiliateUserId,
    accountingPeriod,
    amountBdt: amount,
    reference,
    createdAt: new Date(),
  });
  await db.collection("audit_logs").insertOne({
    actorId: admin.id ?? admin.email ?? "admin",
    actorRole: "ROLE_ADMIN",
    action: "PAYOUT_EXECUTED",
    targetType: "USER",
    targetId: affiliateUserId,
    metadata: { amountBdt: amount },
    createdAt: new Date(),
  });
  const { createInAppNotification: notify } = await import("@/lib/notifications");
  await notify(affiliateUserId, "AFFILIATE_PAYOUT", "Payout sent", `৳${amount} payout recorded (${reference}).`);
  return { success: true };
}

export async function getSystemSettings() {
  await requireAdmin();
  const client = await clientPromise;
  const doc = await client.db().collection("system_settings").findOne({ _id: "GLOBAL_SETTINGS" } as never);
  return {
    pendingRequestExpiryDays: Number(doc?.pendingRequestExpiryDays ?? 7),
    affiliateMaxActiveCodes: Number(doc?.affiliateMaxActiveCodes ?? 5),
    defaultCommissionPerGbBdt: Number(doc?.defaultCommissionPerGbBdt ?? 10),
    minimumOwnerProfitBdt: Number(doc?.minimumOwnerProfitBdt ?? 15),
  };
}

export async function saveSystemSettings(input: {
  pendingRequestExpiryDays: number;
  affiliateMaxActiveCodes: number;
  defaultCommissionPerGbBdt: number;
  minimumOwnerProfitBdt: number;
}) {
  const admin = await requireAdmin();
  const clean = {
    pendingRequestExpiryDays: Number(input.pendingRequestExpiryDays),
    affiliateMaxActiveCodes: Number(input.affiliateMaxActiveCodes),
    defaultCommissionPerGbBdt: Number(input.defaultCommissionPerGbBdt),
    minimumOwnerProfitBdt: Number(input.minimumOwnerProfitBdt),
  };
  if (!Number.isInteger(clean.pendingRequestExpiryDays) || clean.pendingRequestExpiryDays < 1 || clean.pendingRequestExpiryDays > 30)
    throw new Error("Expiry must be 1–30 days.");
  if (!Number.isInteger(clean.affiliateMaxActiveCodes) || clean.affiliateMaxActiveCodes < 1 || clean.affiliateMaxActiveCodes > 20)
    throw new Error("Max active codes must be 1–20.");
  if (!Number.isInteger(clean.defaultCommissionPerGbBdt) || clean.defaultCommissionPerGbBdt < 0)
    throw new Error("Commission must be an integer ≥ 0.");
  if (!Number.isInteger(clean.minimumOwnerProfitBdt) || clean.minimumOwnerProfitBdt < 0)
    throw new Error("Profit floor must be an integer ≥ 0.");
  const client = await clientPromise;
  await client.db().collection("system_settings").updateOne(
    { _id: "GLOBAL_SETTINGS" } as never,
    { $set: { ...clean, _id: "GLOBAL_SETTINGS" } },
    { upsert: true },
  );
  await client.db().collection("audit_logs").insertOne({
    actorId: admin.id ?? admin.email ?? "admin",
    actorRole: "ROLE_ADMIN",
    action: "SETTINGS_UPDATED",
    targetType: "SETTINGS",
    targetId: "GLOBAL_SETTINGS",
    metadata: clean,
    createdAt: new Date(),
  });
  return { success: true };
}

/* ------------------------------------------------------------------ */
/* Redeem codes minting (admin generates; single-use, never deleted)   */
/* ------------------------------------------------------------------ */

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function randomRedeemCode(chars = 16): string {
  // ≥12-char Crockford Base32 from CSPRNG (02 §17) — short codes forbidden here.
  const buf = randomBytes(chars);
  let out = "";
  for (let i = 0; i < chars; i++) out += CROCKFORD[buf[i] % 32];
  return out;
}

export interface RedeemMintInput {
  providerId: string;
  proxyType: "RESIDENTIAL" | "MOBILE" | "DATACENTER" | "PREMIUM_RESIDENTIAL";
  planId?: string;
  bandwidthGb: number;
  monetaryValuationBdt?: number;
  validDays?: number;
}

export async function generateRedeemCode(input: RedeemMintInput) {
  const admin = await requireAdmin();
  const client = await clientPromise;
  const db = client.db();
  const billing = await loadProviderBilling(db, input.providerId ?? "dataimpulse");
  if (billing.status !== "ACTIVE") throw new Error(`Provider "${billing.name}" is not ACTIVE.`);
  if (!billing.pools.includes(input.proxyType)) {
    // Legacy rows without pools: fall back to all four.
    const pools = billing.pools.length > 0 ? billing.pools : ["RESIDENTIAL", "MOBILE", "DATACENTER", "PREMIUM_RESIDENTIAL"];
    if (!pools.includes(input.proxyType)) throw new Error(`Provider "${billing.name}" does not sell ${input.proxyType}.`);
  }
  const gb = Number(input.bandwidthGb);
  if (!Number.isInteger(gb) || gb < 1 || gb > 1000) throw new Error("Bandwidth must be an integer 1–1000 GB.");
  const validDays = input.validDays === undefined ? 30 : Number(input.validDays);
  if (!Number.isInteger(validDays) || validDays < 1 || validDays > 365) {
    throw new Error("Validity must be 1–365 days.");
  }
  // Unique secure code with collision retry (unique index is the backstop).
  let code = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = randomRedeemCode(16);
    const exists = await db.collection("redeem_codes").findOne({ code: candidate });
    if (!exists) {
      code = candidate;
      break;
    }
  }
  if (!code) throw new Error("Code collision — try again.");
  const now = new Date();
  await db.collection("redeem_codes").insertOne({
    code,
    bandwidthBytes: gb * 1073741824,
    providerId: billing.providerId,
    proxyType: input.proxyType,
    planRef: input.planId || undefined,
    monetaryValuationBdt: input.monetaryValuationBdt !== undefined ? Number(input.monetaryValuationBdt) : undefined,
    status: "ACTIVE",
    validTo: new Date(now.getTime() + validDays * 86400000),
    createdAt: now,
  });
  await db.collection("audit_logs").insertOne({
    actorId: admin.id ?? admin.email ?? "admin",
    actorRole: "ROLE_ADMIN",
    action: "REDEEM_CODE_GENERATED",
    targetType: "REDEEM_CODE",
    targetId: `${code.slice(0, 4)}…`,
    metadata: { providerId: billing.providerId, proxyType: input.proxyType, bandwidthGb: gb },
    createdAt: new Date(),
  });
  return { success: true, code };
}

export async function getRedeemCodesAdmin() {
  await requireAdmin();
  const client = await clientPromise;
  const rows = await client.db().collection("redeem_codes").find({}).sort({ createdAt: -1 }).limit(300).toArray();
  return rows.map((r) => ({ ...r, _id: String(r._id) }));
}

export async function disableRedeemCode(code: string) {
  await requireAdmin();
  const clean = String(code ?? "").trim().toUpperCase();
  const client = await clientPromise;
  const res = await client.db().collection("redeem_codes").updateOne(
    { code: clean, status: { $in: ["GENERATED", "ACTIVE"] } },
    { $set: { status: "DISABLED", updatedAt: new Date() } },
  );
  if (res.matchedCount === 0) throw new Error("Code not found or already terminal (USED/EXPIRED/DISABLED).");
  return { success: true };
}

export async function getSupportTicketsAdmin() {
  const admin = await requireAdmin();
  const client = await clientPromise;
  const db = client.db();

  const tickets = await db.collection("support_tickets").find().sort({ createdAt: -1 }).toArray();
  
  return tickets.map((t) => ({
    _id: t._id.toString(),
    name: t.name,
    email: t.email,
    message: t.message,
    status: t.status,
    ip: t.ip,
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function updateSupportTicketStatus(id: string, status: "OPEN" | "RESOLVED") {
  const admin = await requireAdmin();
  const client = await clientPromise;
  const db = client.db();

  await db.collection("support_tickets").updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, updatedAt: new Date() } }
  );
  return { success: true };
}

export async function replySupportTicket(ticketId: string, replyMessage: string) {
  await requireAdmin();
  const cleanReply = String(replyMessage ?? "").trim();
  if (cleanReply.length < 5) throw new Error("Reply must be at least 5 characters.");
  
  const client = await clientPromise;
  const db = client.db();
  
  const oid = asObjectId(ticketId, "ticketId");
  const ticket = await db.collection("support_tickets").findOneAndUpdate(
    { _id: oid },
    { $set: { status: "RESOLVED", adminReply: cleanReply, repliedAt: new Date() } },
    { returnDocument: "after" }
  );
  
  if (!ticket) throw new Error("Ticket not found.");
  
  // Try to find if user has an account with this email
  const user = await db.collection("user").findOne({ email: ticket.email.toLowerCase() });
  
  if (user) {
    // Send in-app notification
    const { createInAppNotification: notify } = await import("@/lib/notifications");
    await notify(
      user._id.toString(), 
      "SUPPORT_REPLY" as any, 
      "Support Ticket Reply", 
      `Admin replied: ${cleanReply.length > 50 ? cleanReply.slice(0, 50) + '...' : cleanReply}`
    );
  }
  
  return { success: true, deliveredToApp: !!user };
}

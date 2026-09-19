import clientPromise from "./db/mongodb";
import type { Notification } from "./db/schema";

type NotificationType = Notification["type"];
// LOCKED per 02 §29 — no free strings, no INFO/SUCCESS generics.
// Emitted: PURCHASE_RECEIVED, PURCHASE_APPROVED, PURCHASE_REJECTED,
// PURCHASE_CANCELLED, REDEEM_SUCCESS, ACCOUNT_SUSPENDED, ACCOUNT_RESTORED,
// AFFILIATE_REFERRAL, AFFILIATE_PAYOUT, SUPPORT_REPLY, NEW_SUPPORT_TICKET,
// NEW_ORDER_RECEIVED. Reserved (no trigger wired yet): PROXY_ACTIVATED,
// PURCHASE_EXPIRED (TTL sweeper deletes silently), PAYOUT_REQUESTED
// (no request flow), LOW_INVENTORY_ALERT (no threshold watcher).

/**
 * Creates an in-app notification in the database for the user.
 * This guarantees delivery even if the 100/day SMTP limit is reached.
 * Canonical key is publicUserId (PX-…) on both write and read — readers
 * filter by publicUserId, so hex _ids must never be stored here.
 * Never store secrets, proxy passwords, or full TrxIDs here.
 */
export async function createInAppNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  targetUrl?: string,
) {
  const client = await clientPromise;
  const db = client.db();

  // Canonicalize to publicUserId. Legacy callers may pass a hex _id —
  // resolve it forward instead of storing a key no reader matches.
  let resolvedUserId = String(userId ?? "");
  if (/^[0-9a-fA-F]{24}$/.test(resolvedUserId)) {
    const { ObjectId } = await import("mongodb");
    const user = await db.collection("user").findOne({ _id: new ObjectId(resolvedUserId) });
    if (user?.publicUserId) {
      resolvedUserId = String(user.publicUserId);
    } else {
      console.warn("createInAppNotification: could not resolve user", userId);
      return;
    }
  }
  if (!resolvedUserId) {
    console.warn("createInAppNotification: empty userId — skipping");
    return;
  }

  await db.collection("notifications").insertOne({
    userId: resolvedUserId,
    type,
    title,
    message,
    targetUrl: targetUrl || null,
    read: false,
    createdAt: new Date(),
  });
}


/**
 * Broadcasts an in-app notification to ALL users with the ROLE_ADMIN capability.
 * Use this for system-wide alerts (new tickets, new manual orders, inventory issues).
 */
export async function createAdminNotification(
  type: NotificationType,
  title: string,
  message: string,
  targetUrl?: string,
) {
  const client = await clientPromise;
  const db = client.db();

  // 1. Find all admin users
  const admins = await db.collection("user").find({ role: "ROLE_ADMIN" }).project({ publicUserId: 1 }).toArray();

  if (admins.length === 0) return;

  // 2. Prepare bulk notifications (canonical publicUserId keying)
  const docs = admins
    .filter((admin) => admin.publicUserId)
    .map((admin) => ({
      userId: String(admin.publicUserId),
      type,
      title,
      message,
      targetUrl: targetUrl || null,
      read: false,
      createdAt: new Date(),
    }));

  // 3. Insert for all admins
  if (docs.length === 0) return;
  await db.collection("notifications").insertMany(docs);
}

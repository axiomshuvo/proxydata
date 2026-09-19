import clientPromise from "./db/mongodb";
import type { Notification } from "./db/schema";

type NotificationType = Notification["type"];
// LOCKED per 02 §29 — no free strings, no INFO/SUCCESS generics.
// Allowed: PURCHASE_RECEIVED, PURCHASE_APPROVED, PROXY_ACTIVATED,
// PURCHASE_REJECTED, PURCHASE_CANCELLED, PURCHASE_EXPIRED,
// REDEEM_SUCCESS, ACCOUNT_SUSPENDED, ACCOUNT_RESTORED,
// AFFILIATE_REFERRAL, AFFILIATE_PAYOUT, SUPPORT_REPLY, NEW_SUPPORT_TICKET, NEW_ORDER_RECEIVED, PAYOUT_REQUESTED, LOW_INVENTORY_ALERT

/**
 * Creates an in-app notification in the database for the user.
 * This guarantees delivery even if the 100/day SMTP limit is reached.
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

  // Resolve publicUserId to internal user._id if necessary
  let resolvedUserId = userId;
  if (userId.startsWith("PX-")) {
    const user = await db.collection("user").findOne({ publicUserId: userId });
    if (user) {
      resolvedUserId = user._id.toString();
    } else {
      console.warn("createInAppNotification: could not resolve publicUserId", userId);
      return; // Can't notify a non-existent user
    }
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
  const admins = await db.collection("user").find({ role: "ROLE_ADMIN" }).project({ _id: 1 }).toArray();
  
  if (admins.length === 0) return;

  // 2. Prepare bulk notifications
  const docs = admins.map(admin => ({
    userId: admin._id.toString(),
    type,
    title,
    message,
    targetUrl: targetUrl || null,
    read: false,
    createdAt: new Date(),
  }));

  // 3. Insert for all admins
  await db.collection("notifications").insertMany(docs);
}

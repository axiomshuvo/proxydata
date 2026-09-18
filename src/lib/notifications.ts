import clientPromise from "./db/mongodb";
import type { Notification } from "./db/schema";

type NotificationType = Notification["type"];
// LOCKED per 02 §29 — no free strings, no INFO/SUCCESS generics.
// Allowed: PURCHASE_RECEIVED, PURCHASE_APPROVED, PROXY_ACTIVATED,
// PURCHASE_REJECTED, PURCHASE_CANCELLED, PURCHASE_EXPIRED,
// REDEEM_SUCCESS, ACCOUNT_SUSPENDED, ACCOUNT_RESTORED,
// AFFILIATE_REFERRAL, AFFILIATE_PAYOUT

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
) {
  const client = await clientPromise;
  const db = client.db();

  await db.collection("notifications").insertOne({
    userId,
    type,
    title,
    message,
    read: false,
    createdAt: new Date(),
  });
}

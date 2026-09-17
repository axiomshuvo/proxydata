import clientPromise from "./db/mongodb";

type NotificationType = "INFO" | "WARNING" | "SUCCESS" | "CRITICAL";

/**
 * Creates an in-app notification in the database for the user.
 * This guarantees delivery even if the 100/day SMTP limit is reached.
 */
export async function createInAppNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  linkUrl?: string
) {
  const client = await clientPromise;
  const db = client.db();

  await db.collection("notifications").insertOne({
    userId,
    type,
    title,
    message,
    linkUrl: linkUrl || null,
    isRead: false,
    createdAt: new Date(),
  });
}

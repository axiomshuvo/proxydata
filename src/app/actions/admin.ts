"use server";

import { auth } from "@/lib/auth";
import clientPromise from "@/lib/db/mongodb";
import { headers } from "next/headers";

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
 * Get the full "God-Mode" details for a single user
 */
export async function getUserDetails(publicUserId: string) {
  await requireAdmin();
  const client = await clientPromise;
  const db = client.db();
  
  // 1. Get Base User Identity
  const user = await db.collection("user").findOne({ publicUserId });
  if (!user) throw new Error("User not found");

  // 2. Get Proxy Inventory (All their active proxies)
  const proxyAccounts = await db.collection("proxy_accounts").find({ userId: publicUserId }).toArray();
  
  // 3. Get Financial Transactions
  const transactions = await db.collection("transactions")
    .find({ userId: publicUserId })
    .sort({ createdAt: -1 })
    .toArray();

  return {
    user: { ...user, _id: user._id.toString() },
    proxyAccounts: proxyAccounts.map(p => ({ ...p, _id: p._id.toString() })),
    transactions: transactions.map(t => ({ ...t, _id: t._id.toString() })),
  };
}

/**
 * Quick Admin Action: Suspend or Restore a user
 */
export async function updateUserStatus(publicUserId: string, newStatus: "ACTIVE" | "SUSPENDED" | "DEACTIVATED") {
  await requireAdmin();
  const client = await clientPromise;
  const db = client.db();
  
  await db.collection("user").updateOne(
    { publicUserId },
    { $set: { status: newStatus, updatedAt: new Date() } }
  );
  
  return { success: true, status: newStatus };
}

import { addSubUserBalance, createSubUser } from "@/lib/dataimpulse/client";
import { ObjectId } from "mongodb";
import { createInAppNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";


/**
 * Phase 10: Admin Stats
 */
export async function getAdminStats() {
  await requireAdmin();
  const client = await clientPromise;
  const db = client.db();

  const [totalUsers, pendingTxCount, completedTxns] = await Promise.all([
    db.collection("user").countDocuments(),
    db.collection("transactions").countDocuments({ status: "PENDING" }),
    db.collection("transactions").find({ status: "COMPLETED", type: "PURCHASE" }).toArray()
  ]);

  // Aggregate revenue from COMPLETED purchases
  const totalRevenue = completedTxns.reduce((sum, tx) => sum + (tx.amountTaka || 0), 0);

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
 * Phase 10: Approve Transaction (Atomic allocation)
 */
export async function approveTransaction(transactionId: string) {
  await requireAdmin();
  const client = await clientPromise;
  const db = client.db();

  // 1. Lock transaction from PENDING to PROCESSING
  const tx = await db.collection("transactions").findOneAndUpdate(
    { _id: new ObjectId(transactionId), status: "PENDING" },
    { $set: { status: "PROCESSING", updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  if (!tx) {
    throw new Error("Transaction is not PENDING or does not exist.");
  }

  try {
    const bandwidthGb = tx.planGbSnapshot || 0;

    // 2. Fetch or Create Proxy Account
    let proxyAccount = await db.collection("proxy_accounts").findOne({
      userId: tx.userId,
      providerId: "dataimpulse",
      proxyType: "RESIDENTIAL" // Defaulting to residential for now, ideally derived from plan
    });

    let subUserId = proxyAccount ? Number(proxyAccount.providerSubId) : null;
    let login = proxyAccount ? proxyAccount.login : "";
    let password = proxyAccount ? proxyAccount.password : "";

    if (!proxyAccount) {
      const newSubUser = await createSubUser("residential");
      subUserId = newSubUser.id;
      login = newSubUser.login;
      password = newSubUser.password;

      await db.collection("proxy_accounts").insertOne({
        userId: tx.userId,
        providerId: "dataimpulse",
        providerSubId: subUserId,
        proxyType: "RESIDENTIAL",
        login,
        password,
        bandwidthBalanceBytes: 0,
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // 3. Allocate Bandwidth Upstream
    if (bandwidthGb > 0 && subUserId) {
      await addSubUserBalance(subUserId, bandwidthGb);
    }

    // 4. Mark as USED/COMPLETED locally
    await db.collection("transactions").updateOne(
      { _id: tx._id },
      { $set: { status: "COMPLETED", updatedAt: new Date() } }
    );

    // Update Local Proxy Balance
    await db.collection("proxy_accounts").updateOne(
      { userId: tx.userId, providerSubId: subUserId },
      { 
        $inc: { bandwidthBalanceBytes: bandwidthGb * 1024 * 1024 * 1024 },
        $set: { updatedAt: new Date() }
      }
    );

    
    // Phase 11: In-App Notification (Purchase Approved)
    await createInAppNotification(
      tx.userId,
      "SUCCESS",
      "Payment Approved",
      `Your payment was approved! ${bandwidthGb} GB has been allocated to your proxy.`
    );

    return { success: true };

  } catch (error) {
    console.error("Approval failed, rolling back to PENDING:", error);
    // Rollback
    await db.collection("transactions").updateOne(
      { _id: tx._id },
      { $set: { status: "PENDING", updatedAt: new Date() } }
    );
    throw new Error("Upstream allocation failed. Rolled back to PENDING.");
  }
}

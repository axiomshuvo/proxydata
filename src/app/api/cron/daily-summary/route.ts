import { NextResponse } from "next/server";
import clientPromise from "@/lib/db/mongodb";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { logRuntime } from "@/lib/runtime-log";

import { createHash, timingSafeEqual } from "crypto";

export async function GET(req: Request) {
  try {
    // Dedicated cron bearer with constant-time compare — never reuse SMTP_PASS.
    const authHeader = req.headers.get("authorization") ?? "";
    const expected = `Bearer ${env.CRON_SECRET}`;
    const a = createHash("sha256").update(authHeader).digest();
    const b = createHash("sha256").update(expected).digest();
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [newUsers, dailyTransactions] = await Promise.all([
      db.collection("user").countDocuments({ createdAt: { $gte: oneDayAgo } }),
      db.collection("transactions").find({
        createdAt: { $gte: oneDayAgo },
        status: "ACTIVE",
        type: "PURCHASE"
      }).toArray()
    ]);

    const dailyRevenue = dailyTransactions.reduce((sum, tx) => sum + (tx.finalAmountBdt || 0), 0);

    const mailed = await sendEmail({
      to: env.MASTER_ADMIN_EMAIL,
      subject: "ProxyData Daily Summary 📊",
      html: `
        <h2>Daily Operations Summary</h2>
        <p><strong>New Signups:</strong> ${newUsers}</p>
        <p><strong>Total Purchases Completed:</strong> ${dailyTransactions.length}</p>
        <p><strong>Daily Revenue:</strong> ৳${dailyRevenue} BDT</p>
        <hr />
        <p><em>This is an automated system report.</em></p>
      `
    });

    logRuntime({
      level: mailed.success ? "INFO" : "ERROR",
      source: "cron",
      operation: "DAILY_SUMMARY",
      status: mailed.success ? "SUCCESS" : "FAILED",
      message: `Daily summary: ${newUsers} signups, ${dailyTransactions.length} purchases, ৳${dailyRevenue}.`,
    });

    return NextResponse.json({ success: true, revenue: dailyRevenue });

  } catch (error) {
    console.error("Cron Error:", error);
    logRuntime({ level: "ERROR", source: "cron", operation: "DAILY_SUMMARY", status: "FAILED", message: "Daily summary crashed." });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

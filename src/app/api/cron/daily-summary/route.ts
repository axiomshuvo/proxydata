import { NextResponse } from "next/server";
import clientPromise from "@/lib/db/mongodb";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${env.SMTP_PASS}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [newUsers, dailyTransactions] = await Promise.all([
      db.collection("users").countDocuments({ createdAt: { $gte: oneDayAgo } }),
      db.collection("transactions").find({ 
        createdAt: { $gte: oneDayAgo },
        status: "COMPLETED",
        type: "PURCHASE"
      }).toArray()
    ]);

    const dailyRevenue = dailyTransactions.reduce((sum, tx) => sum + (tx.amountTaka || 0), 0);

    await sendEmail({
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

    return NextResponse.json({ success: true, revenue: dailyRevenue });

  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

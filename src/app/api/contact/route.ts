import { createAdminNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/db/mongodb";
import { headers } from "next/headers";

/**
 * Support tickets (04 §3.1): throttled 3/hour/IP, stored — never rendered
 * as HTML (XSS-safe plain text only) and never emailed (SMTP quota).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim().slice(0, 80);
    const email = String(body.email ?? "").trim().toLowerCase().slice(0, 120);
    const message = String(body.message ?? "").trim().slice(0, 2000);
    if (name.length < 2) return NextResponse.json({ error: "Tell us your name." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }
    if (message.length < 10) return NextResponse.json({ error: "Message needs at least 10 characters." }, { status: 400 });

    const ip =
      (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ||
      (await headers()).get("x-real-ip") ||
      "unknown";

    const client = await clientPromise;
    const db = client.db();
    const hourAgo = new Date(Date.now() - 3600 * 1000);
    const recent = await db.collection("support_tickets").countDocuments({ ip, createdAt: { $gte: hourAgo } });
    if (recent >= 3) {
      return NextResponse.json({ error: "Too many messages — try again in an hour." }, { status: 429 });
    }

    await db.collection("support_tickets").insertOne({
      name,
      email,
      message, // plain text only — UI must never dangerouslySetInnerHTML this
      ip,
      status: "OPEN",
      createdAt: new Date(),
    });

    // Notify admins
    await createAdminNotification(
      "NEW_SUPPORT_TICKET",
      "New Support Ticket",
      `From: ${name} (${email}). Message: ${message.slice(0, 40)}...`,
      "/axiomshuvo/tickets"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/contact Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

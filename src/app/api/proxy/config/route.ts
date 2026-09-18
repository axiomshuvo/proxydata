import { ObjectId } from "mongodb";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import clientPromise from "@/lib/db/mongodb";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const proxyAccountId = searchParams.get("proxyAccountId");

    if (!proxyAccountId) {
      return NextResponse.json({ error: "Missing proxyAccountId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Verify ownership
    const account = await db.collection("proxy_accounts").findOne({
      _id: new ObjectId(proxyAccountId), // Depending on if it's string or ObjectId in Mongo, we assume string or adapt
      userId: session.user.publicUserId
    });

    if (!account) {
      return NextResponse.json({ error: "Proxy account not found or unauthorized" }, { status: 404 });
    }
    // Entitlement gate (01 §18): unentitled/suspended pools reject with 403.
    if (account.status !== "ACTIVE") {
      return NextResponse.json({ error: "Proxy account suspended." }, { status: 403 });
    }

    const config = await db.collection("proxy_configurations").findOne({ proxyAccountId });

    return NextResponse.json({ config });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { proxyAccountId, mode, protocol, country, state, city, asn } = body;

    if (!proxyAccountId) {
      return NextResponse.json({ error: "Missing proxyAccountId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Verify ownership
    const account = await db.collection("proxy_accounts").findOne({ 
      _id: new ObjectId(proxyAccountId),
      userId: session.user.publicUserId 
    });

    if (!account) {
      return NextResponse.json({ error: "Proxy account not found or unauthorized" }, { status: 404 });
    }
    // Entitlement gate (01 §18) + strict allowlists (01 §24.1).
    if (account.status !== "ACTIVE") {
      return NextResponse.json({ error: "Proxy account suspended." }, { status: 403 });
    }
    if (mode !== undefined && mode !== "ROTATING" && mode !== "STICKY") {
      return NextResponse.json({ error: "Bad mode." }, { status: 400 });
    }
    if (protocol !== undefined && protocol !== "HTTP" && protocol !== "SOCKS5") {
      return NextResponse.json({ error: "Bad protocol." }, { status: 400 });
    }

    // Upsert the configuration
    const updatedConfig = {
      proxyAccountId,
      mode: mode || "ROTATING",
      protocol: protocol || "HTTP",
      country: country || null,
      state: state || null,
      city: city || null,
      asn: asn || null,
      updatedAt: new Date(),
    };

    await db.collection("proxy_configurations").updateOne(
      { proxyAccountId },
      { $set: updatedConfig },
      { upsert: true }
    );

    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

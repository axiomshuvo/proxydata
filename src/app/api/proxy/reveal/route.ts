import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import clientPromise from "@/lib/db/mongodb";
import { headers } from "next/headers";

/**
 * Reveal-once proxy password (02 §43): the owning authenticated user only,
 * every reveal written to audit_logs. Passwords are otherwise masked
 * everywhere (list responses strip them).
 */
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { proxyAccountId } = await req.json();
    if (!proxyAccountId) return NextResponse.json({ error: "Missing proxyAccountId." }, { status: 400 });

    let oid: ObjectId;
    try {
      oid = new ObjectId(proxyAccountId);
    } catch {
      return NextResponse.json({ error: "Bad proxyAccountId." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const account = await db.collection("proxy_accounts").findOne({
      _id: oid,
      userId: session.user.publicUserId,
    });
    if (!account) return NextResponse.json({ error: "Proxy account not found." }, { status: 404 });
    if (account.status !== "ACTIVE") {
      return NextResponse.json({ error: "Account suspended — credentials locked." }, { status: 403 });
    }

    await db.collection("audit_logs").insertOne({
      actorId: session.user.publicUserId,
      actorRole: "USER",
      action: "PROXY_PASSWORD_REVEALED",
      targetType: "PROXY_ACCOUNT",
      targetId: proxyAccountId,
      createdAt: new Date(),
    });

    return NextResponse.json({ login: account.login, password: account.password });
  } catch (error) {
    console.error("POST /api/proxy/reveal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/db/mongodb";
import { decrypt, DecryptionError } from "@/lib/crypto";
import { assertSameOrigin, requireActiveUser } from "@/lib/route-guard";
import { hitRateLimit } from "@/lib/rate-limit";
import { logRuntime } from "@/lib/runtime-log";

/**
 * Reveal-once proxy password (02 §43): the owning authenticated user only,
 * every reveal written to audit_logs. Passwords are otherwise masked
 * everywhere (list responses strip them).
 */
export async function POST(req: Request) {
  try {
    const csrf = assertSameOrigin(req);
    if (csrf) return csrf;
    const got = await requireActiveUser();
    if ("response" in got) return got.response;
    const session = got.session;

    const { proxyAccountId } = await req.json();
    if (!proxyAccountId) return NextResponse.json({ error: "Missing proxyAccountId." }, { status: 400 });

    const burst = hitRateLimit(`reveal:${session.user.publicUserId}`, 10, 60 * 60 * 1000);
    if (!burst.allowed) {
      return NextResponse.json(
        { error: "Too many reveal attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(burst.retryAfterMs / 1000)) } },
      );
    }

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

    let password: string;
    try {
      password = decrypt(account.password);
    } catch (error) {
      logRuntime({
        level: "ERROR",
        source: "api",
        operation: "PROXY_REVEAL_DECRYPT",
        status: "FAILED",
        message: `Decrypt failed for proxy account ${proxyAccountId} (${error instanceof DecryptionError ? error.message : "unknown"}).`,
      });
      return NextResponse.json({ error: "Credential unavailable — contact support." }, { status: 500 });
    }

    return NextResponse.json({ login: account.login, password });
  } catch (error) {
    console.error("POST /api/proxy/reveal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

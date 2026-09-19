import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import clientPromise from "@/lib/db/mongodb";
import { hitRateLimit } from "@/lib/rate-limit";

/*
  Resolve a live password-reset token to its account email so the reset form
  can show WHOSE password is being changed. Token-gated: only the inbox
  holder has the unguessable single-use token, and an attacker holding it
  could already reset the password outright — revealing the email adds no
  capability. Invalid/expired/missing tokens all return the same 404.
*/

const QuerySchema = z.object({
  token: z
    .string()
    .regex(/^[A-Za-z0-9_-]{10,128}$/, "Invalid token."),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = QuerySchema.safeParse({ token: searchParams.get("token") });
    if (!parsed.success) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const { token } = parsed.data;

    // Brute-force guard on an unguessable space (defense in depth).
    const burst = hitRateLimit(`reset-identity:${token}`, 20, 10 * 60 * 1000);
    if (!burst.allowed) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const client = await clientPromise;
    const db = client.db();
    // Exact-match lookup — the token is data here, never a query operator.
    const verification = await db.collection("verification").findOne({
      identifier: `reset-password:${token}`,
    });
    if (!verification) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const expiresAt =
      verification.expiresAt instanceof Date
        ? verification.expiresAt
        : new Date(verification.expiresAt);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const userId = String(verification.value ?? "");
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const user = await db.collection("user").findOne(
      { _id: new ObjectId(userId) },
      { projection: { email: 1 } },
    );
    if (!user?.email) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ email: user.email });
  } catch (error) {
    console.error("GET /api/auth/reset-identity Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { ObjectId } from "mongodb";

import { NextResponse } from "next/server";
import clientPromise from "@/lib/db/mongodb";
import { assertSameOrigin, requireActiveUser } from "@/lib/route-guard";

function badId() {
  return NextResponse.json({ error: "Bad proxyAccountId." }, { status: 400 });
}

const COUNTRY_RE = /^[A-Za-z]{2}(,[A-Za-z]{2}){0,7}$/;
const GEO_RE = /^[A-Za-z0-9 .\-]{1,64}$/;
const ASN_RE = /^\d{1,10}$/;

function cleanGeo(value: unknown, re: RegExp): string | null {
  if (value === undefined || value === null || value === "") return null;
  const s = String(value).trim();
  if (!re.test(s)) return null;
  return s;
}

export async function GET(req: Request) {
  try {
    const got = await requireActiveUser();
    if ("response" in got) return got.response;
    const session = got.session;

    const { searchParams } = new URL(req.url);
    const proxyAccountId = searchParams.get("proxyAccountId");

    if (!proxyAccountId || !ObjectId.isValid(proxyAccountId)) {
      return badId();
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
    const csrf = assertSameOrigin(req);
    if (csrf) return csrf;
    const got = await requireActiveUser();
    if ("response" in got) return got.response;
    const session = got.session;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const { proxyAccountId, mode, protocol, country, state, city, asn } = (body ?? {}) as Record<string, unknown>;

    if (!proxyAccountId || !ObjectId.isValid(String(proxyAccountId))) {
      return badId();
    }

    const client = await clientPromise;
    const db = client.db();

    // Verify ownership
    const account = await db.collection("proxy_accounts").findOne({
      _id: new ObjectId(String(proxyAccountId)),
      userId: session.user.publicUserId
    });

    if (!account) {
      return NextResponse.json({ error: "Proxy account not found or unauthorized" }, { status: 404 });
    }
    // Entitlement gate (01 §18) + strict allowlists (01 §24.1).
    if (account.status !== "ACTIVE") {
      return NextResponse.json({ error: "Proxy account suspended." }, { status: 403 });
    }
    const cleanMode = typeof mode === "string" ? mode.toLowerCase() : undefined;
    if (cleanMode !== undefined && cleanMode !== "rotating" && cleanMode !== "sticky") {
      return NextResponse.json({ error: "Bad mode." }, { status: 400 });
    }
    const cleanProtocol = typeof protocol === "string" ? protocol.toLowerCase() : undefined;
    if (cleanProtocol !== undefined && cleanProtocol !== "http" && cleanProtocol !== "socks5") {
      return NextResponse.json({ error: "Bad protocol." }, { status: 400 });
    }
    // Geo fields are allowlisted — never store raw user input (stored-XSS guard).
    const cleanCountry = cleanGeo(country, COUNTRY_RE);
    const cleanState = cleanGeo(state, GEO_RE);
    const cleanCity = cleanGeo(city, GEO_RE);
    const cleanAsn = cleanGeo(asn, ASN_RE);
    if (country && !cleanCountry) return NextResponse.json({ error: "Bad country." }, { status: 400 });
    if (state && !cleanState) return NextResponse.json({ error: "Bad state." }, { status: 400 });
    if (city && !cleanCity) return NextResponse.json({ error: "Bad city." }, { status: 400 });
    if (asn && !cleanAsn) return NextResponse.json({ error: "Bad ASN." }, { status: 400 });

    // Upsert the configuration
    const updatedConfig = {
      proxyAccountId: String(proxyAccountId),
      mode: cleanMode || "rotating",
      protocol: cleanProtocol || "http",
      country: cleanCountry,
      state: cleanState,
      city: cleanCity,
      asn: cleanAsn,
      updatedAt: new Date(),
    };

    await db.collection("proxy_configurations").updateOne(
      { proxyAccountId: String(proxyAccountId) },
      { $set: updatedConfig },
      { upsert: true }
    );

    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

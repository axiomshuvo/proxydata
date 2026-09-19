import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import clientPromise from "@/lib/db/mongodb";
import { headers } from "next/headers";
import { getResellerBalance } from "@/lib/dataimpulse/client";
import { escapeRegex } from "@/lib/route-guard";

const PAGE_LIMIT = 100;

interface UnifiedLog {
  _id: string;
  createdAt: Date;
  level: "INFO" | "WARN" | "ERROR";
  source: string;
  provider: string | null;
  operation: string | null;
  message: string;
  status: string | null;
  refId: string | null;
}

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((session.user as unknown as { role?: string }).role !== "ROLE_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const level = ["ALL", "INFO", "WARN", "ERROR"].includes(searchParams.get("level") ?? "ALL")
      ? (searchParams.get("level") as string)
      : "ALL";
    const source = ["ALL", "adapter", "admin", "api", "cron", "auth", "email", "system"].includes(
      searchParams.get("source") ?? "ALL",
    )
      ? (searchParams.get("source") as string)
      : "ALL";
    const provider = String(searchParams.get("provider") || "ALL").slice(0, 32);
    // Escape before $regex — raw user input here is a ReDoS vector.
    const q = escapeRegex(searchParams.get("q") || "");
    const limit = Math.min(Number(searchParams.get("limit")) || PAGE_LIMIT, 500);

    const client = await clientPromise;
    const db = client.db();
    const logs: UnifiedLog[] = [];
    const want = (s: string) => source === "ALL" || source === s;
    const levelOk = (l: string) => level === "ALL" || level === l;

    // 1. Provider operations (indefinite retention — reconciliation spine).
    if (want("adapter") || want("admin")) {
      const match: Record<string, unknown> = {};
      if (provider !== "ALL") match.provider = provider;
      if (q) match.operationType = { $regex: q, $options: "i" };
      const ops = await db
        .collection("provider_operation_logs")
        .find(match)
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      for (const o of ops) {
        const st = String(o.status ?? "");
        const lv = st === "FAILED" || st === "TIMEOUT" ? "ERROR" : "INFO";
        if (!levelOk(lv)) continue;
        logs.push({
          _id: o._id.toString(),
          createdAt: o.createdAt,
          level: lv as UnifiedLog["level"],
          source: "adapter",
          provider: (o.provider as string) ?? null,
          operation: (o.operationType as string) ?? null,
          message: `${o.operationType} → ${st}`,
          status: st,
          refId: (o.transactionId as string) ?? null,
        });
      }
    }

    // 2. Admin audit trail (indefinite retention).
    if (want("admin")) {
      const match: Record<string, unknown> = {};
      if (q) match.action = { $regex: q, $options: "i" };
      const audits = await db
        .collection("audit_logs")
        .find(match)
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      for (const a of audits) {
        if (!levelOk("INFO")) continue;
        const target = String(a.targetId ?? "");
        logs.push({
          _id: a._id.toString(),
          createdAt: a.createdAt,
          level: "INFO",
          source: "admin",
          provider: null,
          operation: (a.action as string) ?? null,
          message: `${a.action} → ${a.targetType}:${target.slice(-8)}`,
          status: null,
          refId: target || null,
        });
      }
    }

    // 3. Runtime noise (30-day TTL).
    if (want("api") || want("cron") || want("auth") || want("email") || want("system") || source === "ALL") {
      const match: Record<string, unknown> = {};
      if (source !== "ALL") match.source = source;
      if (level !== "ALL") match.level = level;
      if (provider !== "ALL") match.provider = provider;
      if (q) match.message = { $regex: q, $options: "i" };
      const rows = await db
        .collection("runtime_logs")
        .find(match)
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      for (const r of rows) {
        logs.push({
          _id: r._id.toString(),
          createdAt: r.createdAt,
          level: r.level,
          source: r.source,
          provider: (r.provider as string) ?? null,
          operation: (r.operation as string) ?? null,
          message: String(r.message ?? ""),
          status: (r.status as string) ?? null,
          refId: (r.refId as string) ?? null,
        });
      }
    }

    logs.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    // ---- Runtime health strip (live, not a log) ----
    const t0 = Date.now();
    let reachable = false;
    let resellerBalanceGb: number | null = null;
    try {
      resellerBalanceGb = await getResellerBalance();
      reachable = true;
    } catch {
      reachable = false;
    }
    const adapterLatencyMs = Date.now() - t0;

    let storageUsedMb = 0;
    try {
      const stats = (await db.command({ dbStats: 1 })) as unknown as { dataSize?: number };
      storageUsedMb = Math.round(((stats.dataSize ?? 0) / 1048576) * 10) / 10;
    } catch {
      storageUsedMb = 0;
    }

    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const emailSentToday = await db.collection("runtime_logs").countDocuments({
      source: "email",
      operation: "EMAIL_SEND",
      status: "SUCCESS",
      createdAt: { $gte: dayStart },
    });

    return NextResponse.json({
      logs: logs.slice(0, limit),
      health: {
        resellerBalanceGb,
        adapterReachable: reachable,
        adapterLatencyMs,
        storageUsedMb,
        storageLimitMb: 512,
        emailSentToday,
        emailLimit: 100,
        time: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("GET /api/axiomshuvo/logs Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

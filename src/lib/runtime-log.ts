import clientPromise from "./db/mongodb";

export type RuntimeLevel = "INFO" | "WARN" | "ERROR";
export type RuntimeSource = "api" | "admin" | "cron" | "adapter" | "auth" | "email" | "system";

export interface RuntimeLogInput {
  level: RuntimeLevel;
  source: RuntimeSource;
  /** Short human reason. NEVER secrets: no passwords, tokens, full TrxIDs (last-4 only). */
  message: string;
  provider?: string; // e.g. "dataimpulse"
  pool?: string; // e.g. "MOBILE"
  operation?: string; // e.g. "ADD_BALANCE", "TOKEN_REFRESH", "EMAIL_SEND"
  latencyMs?: number;
  status?: string; // e.g. "SUCCESS" | "FAILED" | "TIMEOUT"
  refId?: string; // correlation id: transactionId / publicUserId (never full TrxID)
}

let indexEnsured = false;

async function ensureTtl() {
  if (indexEnsured) return;
  try {
    const client = await clientPromise;
    // Runtime rows are noise, not ledger: 30-day TTL protects the 512 MB tier.
    await client.db().collection("runtime_logs").createIndex({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });
    await client.db().collection("runtime_logs").createIndex({ source: 1, level: 1, createdAt: -1 });
    indexEnsured = true;
  } catch {
    // Logging must never crash the request path.
  }
}

/** Fire-and-forget runtime log write. Never throws. */
export function logRuntime(entry: RuntimeLogInput): void {
  void (async () => {
    try {
      const client = await clientPromise;
      await ensureTtl();
      await client.db().collection("runtime_logs").insertOne({
        ...entry,
        createdAt: new Date(),
      });
    } catch {
      // Swallowed on purpose.
    }
  })();
}

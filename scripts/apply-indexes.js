const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

// Manually parse .env.local or .env for standalone script execution
function loadEnv() {
  const envPaths = [".env.local", ".env"];
  for (const file of envPaths) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      content.split("\n").forEach((line) => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || "";
          value = value.replace(/^['"]|['"]$/g, ""); // remove quotes
          process.env[key] = value;
        }
      });
      console.log(`Loaded environment from ${file}`);
      return;
    }
  }
}

loadEnv();

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("❌ MONGODB_URI is not defined in your .env or .env.local file.");
  process.exit(1);
}

async function applyIndexes() {
  const client = new MongoClient(uri);

  try {
    console.log("⏳ Connecting to MongoDB...");
    await client.connect();
    
    // Default database parsed from the URI
    const db = client.db();
    console.log(`✅ Connected to database: ${db.databaseName}`);

    // 1. USERS — Better Auth stores identity in `user` (singular) at runtime;
    // index it (spec 02 §32 names it `users` — cover both, harmless).
    console.log("Applying indexes for 'user'/'users'...");
    for (const coll of ["user", "users"]) {
      await db.collection(coll).createIndex({ publicUserId: 1 }, { unique: true });
      await db.collection(coll).createIndex({ email: 1 }, { unique: true });
    }

    // 2. PROXY ACCOUNTS — one sub-user per (userId, providerId, proxyType), 02 §32.
    console.log("Applying indexes for 'proxy_accounts'...");
    await db.collection("proxy_accounts").createIndex(
      { userId: 1, providerId: 1, proxyType: 1 },
      { unique: true }
    );
    await db.collection("proxy_accounts").createIndex(
      { providerId: 1, providerSubUserId: 1 },
      { unique: true }
    );

    // 3. PROXY CONFIGURATIONS
    console.log("Applying indexes for 'proxy_configurations'...");
    await db.collection("proxy_configurations").createIndex({ proxyAccountId: 1 }, { unique: true });

    // 4. TRANSACTIONS — 02 §32: unique tx id + user history + sweeper + TrxID replay guard.
    console.log("Applying indexes for 'transactions'...");
    await db.collection("transactions").createIndex(
      { transactionId: 1 },
      { unique: true }
    );
    await db.collection("transactions").createIndex({ userId: 1, createdAt: -1 });
    await db.collection("transactions").createIndex(
      { idempotencyKey: 1 },
      { unique: true, sparse: true }
    );
    await db.collection("transactions").createIndex({ status: 1, createdAt: 1 });
    await db.collection("transactions").createIndex(
      { paymentReference: 1 },
      { unique: true, sparse: true }
    );
    // Zombie-data guard: auto-delete abandoned unpaid orders after 48h.
    // Partial filter keeps APPROVED/REJECTED history forever; only PENDING
    // rows expire. Requires admin approval SLA comfortably under 48h.
    await db.collection("transactions").createIndex(
      { createdAt: 1 },
      {
        expireAfterSeconds: 48 * 3600,
        partialFilterExpression: { status: "PENDING" },
      }
    );

    // 5. COUPON USAGES + COUPONS (case-insensitive codes need collation at query time;
    // unique code index here, strength-2 collation applied in app queries per 02 §32).
    console.log("Applying indexes for 'coupon_usages'/'coupons'...");
    await db.collection("coupon_usages").createIndex(
      { couponId: 1, transactionId: 1 },
      { unique: true }
    );
    await db.collection("coupon_usages").createIndex({ couponId: 1, userId: 1 });
    await db.collection("coupons").createIndex({ code: 1 }, { unique: true });

    // 5b. REDEEM CODES + AFFILIATE CODES
    await db.collection("redeem_codes").createIndex({ code: 1 }, { unique: true });
    await db.collection("redeem_codes").createIndex({ status: 1, validTo: 1 });
    await db.collection("affiliate_codes").createIndex({ code: 1 }, { unique: true });
    await db.collection("affiliate_codes").createIndex({ affiliateId: 1, status: 1 });
    await db.collection("affiliate_codes").createIndex({ affiliateId: 1, createdAt: -1 });

    // 6. AFFILIATE REFERRALS
    console.log("Applying indexes for 'affiliate_referrals'...");
    await db.collection("affiliate_referrals").createIndex(
      { referredUserId: 1 }, 
      { unique: true }
    );

    // 7. AFFILIATE COMMISSIONS — one decision per purchase + ledger lookups, 02 §32.
    console.log("Applying indexes for 'affiliate_commissions'...");
    await db.collection("affiliate_commissions").createIndex(
      { transactionId: 1 },
      { unique: true }
    );
    await db.collection("affiliate_commissions").createIndex({ affiliateId: 1, status: 1 });
    await db.collection("affiliate_commissions").createIndex({ affiliateId: 1, accountingPeriod: 1 });
    await db.collection("affiliate_commissions").createIndex({ referredUserId: 1 });

    // 8. PROVIDER OPERATION LOGS — idempotent retry key + sweeper, 02 §32.
    console.log("Applying indexes for 'provider_operation_logs'...");
    await db.collection("provider_operation_logs").createIndex(
      { transactionId: 1, operationType: 1 },
      { unique: true }
    );
    await db.collection("provider_operation_logs").createIndex({ status: 1, createdAt: 1 });

    // 9. PROVIDER METADATA
    console.log("Applying indexes for 'provider_metadata'...");
    await db.collection("provider_metadata").createIndex(
      { providerId: 1, poolType: 1, countryCode: 1 },
      { unique: true }
    );

    // 10. RUNTIME LOGS — operational noise only: 30-day TTL (free-tier guard).
    console.log("Applying indexes for 'runtime_logs'...");
    await db.collection("runtime_logs").createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 30 * 24 * 3600 }
    );
    await db.collection("runtime_logs").createIndex({ source: 1, level: 1, createdAt: -1 });

    // 11. PASSWORD RESET REQUESTS — 24h throttle log: auto-clean after 25h.
    console.log("Applying indexes for 'password_reset_requests'...");
    await db.collection("password_reset_requests").createIndex(
      { email: 1, requestedAt: -1 }
    );
    await db.collection("password_reset_requests").createIndex(
      { requestedAt: 1 },
      { expireAfterSeconds: 25 * 3600 }
    );

    console.log("🎉 ALL PHASE 5 MONGODB INDEXES APPLIED SUCCESSFULLY!");

    // 12. NOTIFICATIONS — per-user feed + unread badge (polled every 60s).
    console.log("Applying indexes for 'notifications'...");
    await db.collection("notifications").createIndex({ userId: 1, createdAt: -1 });
    await db.collection("notifications").createIndex({ userId: 1, read: 1 });

  } catch (error) {
    console.error("❌ Error applying indexes:", error);
  } finally {
    await client.close();
    console.log("🔒 MongoDB connection closed.");
  }
}

applyIndexes();

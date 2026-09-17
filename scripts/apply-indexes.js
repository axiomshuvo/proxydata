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

    // 1. USERS
    console.log("Applying indexes for 'users'...");
    await db.collection("users").createIndex({ publicUserId: 1 }, { unique: true });
    await db.collection("users").createIndex({ email: 1 }, { unique: true });

    // 2. PROXY ACCOUNTS
    console.log("Applying indexes for 'proxy_accounts'...");
    await db.collection("proxy_accounts").createIndex(
      { userId: 1, providerId: 1, poolType: 1 },
      { unique: true }
    );

    // 3. PROXY CONFIGURATIONS
    console.log("Applying indexes for 'proxy_configurations'...");
    await db.collection("proxy_configurations").createIndex({ proxyAccountId: 1 }, { unique: true });

    // 4. TRANSACTIONS
    console.log("Applying indexes for 'transactions'...");
    await db.collection("transactions").createIndex(
      { paymentReference: 1 }, 
      { unique: true, sparse: true }
    );

    // 5. COUPON USAGES
    console.log("Applying indexes for 'coupon_usages'...");
    await db.collection("coupon_usages").createIndex(
      { couponId: 1, transactionId: 1 }, 
      { unique: true }
    );

    // 6. AFFILIATE REFERRALS
    console.log("Applying indexes for 'affiliate_referrals'...");
    await db.collection("affiliate_referrals").createIndex(
      { referredUserId: 1 }, 
      { unique: true }
    );

    // 7. AFFILIATE COMMISSIONS
    console.log("Applying indexes for 'affiliate_commissions'...");
    await db.collection("affiliate_commissions").createIndex(
      { transactionId: 1 }, 
      { unique: true }
    );

    // 8. PROVIDER OPERATION LOGS
    console.log("Applying indexes for 'provider_operation_logs'...");
    await db.collection("provider_operation_logs").createIndex(
      { transactionId: 1, operationType: 1 }, 
      { unique: true }
    );

    // 9. PROVIDER METADATA
    console.log("Applying indexes for 'provider_metadata'...");
    await db.collection("provider_metadata").createIndex(
      { providerId: 1, poolType: 1, countryCode: 1 }, 
      { unique: true }
    );

    console.log("🎉 ALL PHASE 5 MONGODB INDEXES APPLIED SUCCESSFULLY!");

  } catch (error) {
    console.error("❌ Error applying indexes:", error);
  } finally {
    await client.close();
    console.log("🔒 MongoDB connection closed.");
  }
}

applyIndexes();

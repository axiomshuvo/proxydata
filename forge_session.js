const { MongoClient } = require("mongodb");
const fs = require("fs");
const crypto = require("crypto");

// Read .env manually
const envVars = fs.readFileSync(".env", "utf8")
  .split("\n")
  .filter(line => line && !line.startsWith("#") && line.includes("="))
  .reduce((acc, line) => {
    const [key, ...rest] = line.split("=");
    acc[key.trim()] = rest.join("=").trim().replace(/(^"|"$)/g, "");
    return acc;
  }, {});

async function run() {
  const client = new MongoClient(envVars.MONGODB_URI);
  await client.connect();
  const db = client.db();
  
  const admin = await db.collection("user").findOne({ email: envVars.MASTER_ADMIN_EMAIL });
  if (!admin) {
    console.log("Admin not found.");
    process.exit(1);
  }
  
  const token = crypto.randomBytes(32).toString("hex");
  
  await db.collection("session").insertOne({
    id: crypto.randomBytes(16).toString("hex"),
    userId: admin.id || admin._id.toString(),
    token: token,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: "127.0.0.1",
    userAgent: "Playwright-Testing"
  });
  
  console.log("SESSION_TOKEN=" + token);
  process.exit(0);
}
run();

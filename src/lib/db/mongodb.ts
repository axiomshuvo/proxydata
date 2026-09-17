import { env } from "@/lib/env";
import { MongoClient, ServerApiVersion } from "mongodb";

const uri = env.MONGODB_URI;

// STRICT RULE: maxPoolSize set to 10 to protect MongoDB Free Tier limits
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

async function connectWithRetry(target: MongoClient, retries = 3): Promise<MongoClient> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await target.connect();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
      }
    }
  }
  throw lastError;
}

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient;
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = connectWithRetry(globalWithMongo._mongoClient);
  }
  client = globalWithMongo._mongoClient;
  clientPromise = globalWithMongo._mongoClientPromise!;
} else {
  client = new MongoClient(uri, options);
  clientPromise = connectWithRetry(client);
}

// Export BOTH the Promise (for async route handlers) and the sync client (for BetterAuth)
export { client as mongoClient };
export default clientPromise;

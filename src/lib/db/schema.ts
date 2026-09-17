import { z } from "zod";

// -----------------------------------------------------------------------------
// 1. USERS COLLECTION
// -----------------------------------------------------------------------------
export const UserRole = z.enum(["ROLE_ADMIN", "ROLE_USER"]);
export const UserStatus = z.enum(["ACTIVE", "SUSPENDED", "DEACTIVATED"]);
export const UserCapability = z.enum(["CAPABILITY_AFFILIATE", "CAPABILITY_RESELLER"]);

export const UserSchema = z.object({
  _id: z.string().optional(), // MongoDB ObjectId stringified
  publicUserId: z.string().startsWith("PX-"), // CSPRNG + Crockford Base32
  email: z.string().email(),
  role: UserRole.default("ROLE_USER"),
  capabilities: z.array(UserCapability).default([]),
  status: UserStatus.default("ACTIVE"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// -----------------------------------------------------------------------------
// 2. PROXY ACCOUNTS COLLECTION
// -----------------------------------------------------------------------------
export const ProviderType = z.enum(["DATAIMPULSE", "PROVIDER_B"]);
export const ProxyType = z.enum(["DATACENTER", "RESIDENTIAL", "MOBILE", "RESIDENTIAL_PREMIUM"]);

export const ProxyAccountSchema = z.object({
  _id: z.string().optional(),
  userId: z.string(), // Reference to User
  providerId: ProviderType,
  proxyType: ProxyType,
  providerSubUserId: z.number().int(), // Upstream sub-user ID
  poolTypeRaw: z.string(), // Raw pool identifier from provider
  password: z.string(), // AES-256-GCM encrypted blob
  createdAt: z.date(),
  updatedAt: z.date(),
});

// -----------------------------------------------------------------------------
// 3. PROXY CONFIGURATIONS COLLECTION
// -----------------------------------------------------------------------------
export const ProtocolType = z.enum(["http", "socks5"]);
export const ModeType = z.enum(["rotating", "sticky"]);

export const ProxyConfigurationSchema = z.object({
  _id: z.string().optional(),
  proxyAccountId: z.string(), // 1:1 Reference to ProxyAccount
  protocol: ProtocolType.default("http"),
  mode: ModeType.default("rotating"),
  
  // Targeting
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  asn: z.string().optional(),
  excludeAsn: z.string().optional(),
  
  // Advanced
  rotationInterval: z.number().int().min(0).max(120).optional(),
  stickyRange: z.number().int().optional(),
  anonymousFilter: z.boolean().default(false),
  whitelistedIps: z.array(z.union([z.ipv4(), z.ipv6()])).default([]),
  consentForSupportView: z.boolean().default(false),
  
  updatedAt: z.date(),
});

// -----------------------------------------------------------------------------
// 4. TRANSACTIONS COLLECTION
// -----------------------------------------------------------------------------
export const TransactionType = z.enum(["PURCHASE", "REDEEM", "ADMIN_ADJUSTMENT"]);
export const TransactionStatus = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "ALLOCATING",
  "PROVIDER_VERIFIED",
  "ACTIVE",
  "EXPIRED",
  "REFUNDED",
  "FAILED"
]);

export const TransactionSchema = z.object({
  _id: z.string().optional(),
  userId: z.string(), // Reference to User
  type: TransactionType,
  status: TransactionStatus.default("PENDING"),
  
  // Payload
  planId: z.string().optional(),
  bandwidthBytes: z.number().int(),
  trafficAddedGb: z.number(),
  balanceChargedGb: z.number().optional(),
  
  // Pricing Snapshot
  priceBdt: z.number(),
  poolCoefficient: z.number().default(1),
  filterMultiplier: z.number().default(1),
  
  // Payment Verification
  paymentReference: z.string().optional(), // sparse unique index
  senderNumber: z.string().optional(),
  
  // Timestamps
  createdAt: z.date(),
  approvedAt: z.date().optional(),
  activatedAt: z.date().optional(),
  expiredAt: z.date().optional(),
});

// -----------------------------------------------------------------------------
// 5. COUPONS COLLECTION
// -----------------------------------------------------------------------------
export const CouponType = z.enum(["FIXED_AMOUNT", "PERCENTAGE"]);

export const CouponSchema = z.object({
  _id: z.string().optional(),
  code: z.string(), // Case-insensitive collation index in MongoDB
  type: CouponType,
  value: z.number(), // Amount in BDT or Percentage (0-100)
  maxDiscountAmount: z.number().optional(),
  
  // Scoping Rules
  targetPlanId: z.string().optional(),
  targetUserId: z.string().optional(),
  
  // State
  isActive: z.boolean().default(true),
  usageCount: z.number().int().default(0),
  maxUses: z.number().int().optional(),
  
  validFrom: z.date().optional(),
  validTo: z.date().optional(),
});

// -----------------------------------------------------------------------------
// EXPORT TYPES
// -----------------------------------------------------------------------------
export type User = z.infer<typeof UserSchema>;
export type ProxyAccount = z.infer<typeof ProxyAccountSchema>;
export type ProxyConfiguration = z.infer<typeof ProxyConfigurationSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type Coupon = z.infer<typeof CouponSchema>;
